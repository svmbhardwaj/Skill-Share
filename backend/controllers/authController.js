// backend/controllers/authController.js
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { OAuth2Client } = require('google-auth-library');

// Initialize Google OAuth client
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Create email transporter
const createTransporter = () => {
    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });
};

// Helper to generate access JWT (short-lived: 1 hour)
const generateAccessToken = (id, tokenVersion) => {
    if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET is not defined in environment variables! Cannot generate token.');
    }
    return jwt.sign({ id, tokenVersion }, process.env.JWT_SECRET, {
        expiresIn: '1h',
    });
};

// Helper to generate refresh JWT (long-lived: 30 days)
const generateRefreshToken = (id, tokenVersion) => {
    if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET is not defined in environment variables!');
    }
    return jwt.sign({ id, tokenVersion, type: 'refresh' }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// @desc    Google OAuth login/register
// @route   POST /api/auth/google
// @access  Public
exports.googleAuth = async (req, res) => {
    const { credential, lat, lon } = req.body;

    try {
        // Verify the Google token
        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        const { sub: googleId, email, name, picture, email_verified } = payload;

        // Reject unverified Google accounts
        if (!email_verified) {
            return res.status(401).json({ success: false, error: 'Google account email is not verified.' });
        }

        // Check if user exists by googleId or email
        let user = await User.findOne({ $or: [{ googleId }, { email }] });

        if (user) {
            // If user exists but doesn't have googleId (registered with email/password),
            // link the Google ID WITHOUT changing authProvider — a password user must
            // keep their password login and 'local' provider.
            if (!user.googleId) {
                user.googleId = googleId;
                if (picture) user.avatar = picture;
                await user.save();
            }
        } else {
            // Create new user with Google info
            const userData = {
                name,
                email,
                googleId,
                avatar: picture,
                authProvider: 'google',
                verified: true, // Google accounts are pre-verified
            };

            // Add location if provided
            if (lat != null && lon != null) {
                userData.location = {
                    type: 'Point',
                    coordinates: [parseFloat(lon), parseFloat(lat)],
                };
            }

            user = await User.create(userData);
        }

        const token = generateAccessToken(user._id, user.tokenVersion || 0);
        const refreshToken = generateRefreshToken(user._id, user.tokenVersion || 0);

        res.status(200).json({
            success: true,
            token,
            refreshToken,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                avatar: user.avatar,
                authProvider: user.authProvider,
            },
        });
    } catch (error) {
        console.error('Google Auth Error:', error);
        
        if (error.message.includes('JWT_SECRET is not defined')) {
            return res.status(500).json({
                success: false,
                error: error.message,
            });
        }
        
        res.status(401).json({
            success: false,
            error: 'Invalid Google credentials.',
        });
    }
};

// @desc    Register a new user (local - kept for backward compatibility)
// @route   POST /api/auth/register
// @access  Public
exports.registerUser = async (req, res) => {
    const { name, email, password, lat, lon } = req.body;

    try {
        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({
                success: false,
                error: 'User with this email already exists.',
            });
        }

        // Location is optional — users can register without sharing their location
        const location = (lat != null && lon != null)
            ? { type: 'Point', coordinates: [parseFloat(lon), parseFloat(lat)] }
            : undefined;

        // Create new user
        const user = await User.create({
            name,
            email,
            password,
            location,
        });

        const token = generateAccessToken(user._id, user.tokenVersion || 0);
        const refreshToken = generateRefreshToken(user._id, user.tokenVersion || 0);

        res.status(201).json({
            success: true,
            token,
            refreshToken,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
            },
        });
    } catch (error) {
        console.error('Registration Error:', error);

        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({
                success: false,
                error: messages.join(', '),
            });
        }
        if (error.message.includes('JWT_SECRET is not defined')) {
             return res.status(500).json({
                success: false,
                error: error.message,
            });
        }
        res.status(500).json({
            success: false,
            error: 'Server error during registration.',
        });
    }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
exports.loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email }).select('+password');

        if (!user || !(await user.matchPassword(password))) {
            return res.status(401).json({
                success: false,
                error: 'Invalid credentials. Please check your email and password.',
            });
        }

        const token = generateAccessToken(user._id, user.tokenVersion || 0);
        const refreshToken = generateRefreshToken(user._id, user.tokenVersion || 0);

        res.status(200).json({
            success: true,
            token,
            refreshToken,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
            },
        });
    } catch (error) {
        console.error('Login Error:', error);
        if (error.message.includes('JWT_SECRET is not defined')) {
             return res.status(500).json({
                success: false,
                error: error.message,
            });
        }
        res.status(500).json({
            success: false,
            error: 'Server error during login.',
        });
    }
};

// @desc    Refresh access token using refresh token
// @route   POST /api/auth/refresh-token
// @access  Public (requires valid refresh token in body)
exports.refreshToken = async (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return res.status(400).json({
            success: false,
            error: 'Refresh token is required.',
        });
    }

    try {
        const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);

        if (decoded.type !== 'refresh') {
            return res.status(401).json({
                success: false,
                error: 'Invalid token type.',
            });
        }

        const user = await User.findById(decoded.id);
        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'User not found.',
            });
        }

        // Check tokenVersion — if user changed password or did logout-everywhere,
        // the tokenVersion in the refresh token won't match
        if ((user.tokenVersion || 0) !== decoded.tokenVersion) {
            return res.status(401).json({
                success: false,
                error: 'Token has been revoked. Please log in again.',
            });
        }

        // Issue new access token
        const newAccessToken = generateAccessToken(user._id, user.tokenVersion || 0);

        res.status(200).json({
            success: true,
            token: newAccessToken,
        });
    } catch (error) {
        console.error('Refresh Token Error:', error);
        return res.status(401).json({
            success: false,
            error: 'Invalid or expired refresh token.',
        });
    }
};

// @desc    Logout everywhere (invalidate all tokens)
// @route   POST /api/auth/logout-everywhere
// @access  Private
exports.logoutEverywhere = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found.' });
        }

        // Increment tokenVersion to invalidate all existing tokens
        user.tokenVersion = (user.tokenVersion || 0) + 1;
        await user.save({ validateBeforeSave: false });

        res.status(200).json({
            success: true,
            message: 'All sessions have been invalidated. Please log in again.',
        });
    } catch (error) {
        console.error('Logout Everywhere Error:', error);
        res.status(500).json({ success: false, error: 'Server error.' });
    }
};

// @desc    Get current logged-in user's profile
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found.',
            });
        }

        res.status(200).json({
            success: true,
            ...user.toObject(),
        });
    } catch (error) {
        console.error('GetMe Error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch user profile. Server error.',
        });
    }
};

// @desc    Update user profile
// @route   PUT /api/auth/update-profile
// @access  Private
exports.updateProfile = async (req, res) => {
    const { name } = req.body;

    try {
        const user = await User.findById(req.user.id);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found.',
            });
        }

        // Update fields if provided
        if (name) user.name = name;

        await user.save();

        res.status(200).json({
            success: true,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                avatar: user.avatar,
            },
        });
    } catch (error) {
        console.error('Update Profile Error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update profile.',
        });
    }
};

// @desc    Forgot password - send reset email
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res) => {
    const { email } = req.body;

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'No account found with that email address.',
            });
        }

        // Check if user registered with Google
        if (user.authProvider === 'google' && !user.password) {
            return res.status(400).json({
                success: false,
                error: 'This account uses Google Sign-In. Please login with Google.',
            });
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        
        // Hash token and set to resetPasswordToken field
        user.resetPasswordToken = crypto
            .createHash('sha256')
            .update(resetToken)
            .digest('hex');
        
        // Set expire time (10 minutes)
        user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

        await user.save();

        // Create reset URL
        const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

        // Email message
        const message = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #3b82f6;">SkillShare Local - Password Reset</h2>
                <p>Hi ${user.name},</p>
                <p>You requested to reset your password. Click the button below to reset it:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${resetUrl}" style="background-color: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; display: inline-block;">Reset Password</a>
                </div>
                <p>Or copy and paste this link in your browser:</p>
                <p style="color: #6b7280; word-break: break-all;">${resetUrl}</p>
                <p><strong>This link will expire in 10 minutes.</strong></p>
                <p>If you didn't request this, please ignore this email.</p>
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
                <p style="color: #9ca3af; font-size: 12px;">SkillShare Local Team</p>
            </div>
        `;

        // Send email
        const transporter = createTransporter();
        
        await transporter.sendMail({
            from: `"SkillShare Local" <${process.env.EMAIL_USER}>`,
            to: user.email,
            subject: 'Password Reset Request - SkillShare Local',
            html: message,
        });

        res.status(200).json({
            success: true,
            message: 'Password reset email sent successfully.',
        });

    } catch (error) {
        console.error('Forgot Password Error:', error);
        
        // Clear reset fields if email fails
        const user = await User.findOne({ email });
        if (user) {
            user.resetPasswordToken = undefined;
            user.resetPasswordExpire = undefined;
            await user.save();
        }

        res.status(500).json({
            success: false,
            error: 'Email could not be sent. Please try again later.',
        });
    }
};

// @desc    Reset password
// @route   POST /api/auth/reset-password
// @access  Public
exports.resetPassword = async (req, res) => {
    const { token, password } = req.body;

    try {
        // Hash the token from URL to compare with stored hash
        const resetPasswordToken = crypto
            .createHash('sha256')
            .update(token)
            .digest('hex');

        // Find user with valid token and not expired
        const user = await User.findOne({
            resetPasswordToken,
            resetPasswordExpire: { $gt: Date.now() },
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                error: 'Invalid or expired reset token. Please request a new password reset.',
            });
        }

        // Set new password (will auto-increment tokenVersion via pre-save hook)
        user.password = password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        user.authProvider = 'local'; // Ensure they can login with password

        await user.save();

        res.status(200).json({
            success: true,
            message: 'Password reset successful. You can now login with your new password.',
        });

    } catch (error) {
        console.error('Reset Password Error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error while resetting password.',
        });
    }
};