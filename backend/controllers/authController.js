// backend/controllers/authController.js
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Helper to generate JWT
const generateToken = (id) => {
    // REMOVED THE FALLBACK TO ENSURE process.env.JWT_SECRET IS ALWAYS USED
    // If process.env.JWT_SECRET is not defined, this will now throw an error
    // which is better than silently using a different secret.
    if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET is not defined in environment variables! Cannot generate token.');
    }
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
exports.registerUser = async (req, res) => {
    const { name, email, password, lat, lon } = req.body;

    // Basic validation for required fields
    if (!name || !email || !password || lat == null || lon == null) {
        return res.status(400).json({
            success: false,
            error: 'All fields are required including location (latitude/longitude).',
        });
    }

    try {
        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({
                success: false,
                error: 'User with this email already exists.',
            });
        }

        // Create new user
        const user = await User.create({
            name,
            email,
            password,
            location: {
                type: 'Point',
                coordinates: [parseFloat(lon), parseFloat(lat)],
            },
        });

        const token = generateToken(user._id);

        res.status(201).json({
            success: true,
            token,
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
        // Catch the error thrown by generateToken if JWT_SECRET is missing
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

    if (!email || !password) {
        return res.status(400).json({
            success: false,
            error: 'Email and password are required.',
        });
    }

    try {
        const user = await User.findOne({ email }).select('+password');

        if (!user || !(await user.matchPassword(password))) {
            return res.status(401).json({
                success: false,
                error: 'Invalid credentials. Please check your email and password.',
            });
        }

        const token = generateToken(user._id);

        res.status(200).json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
            },
        });
    } catch (error) {
        console.error('Login Error:', error);
        // Catch the error thrown by generateToken if JWT_SECRET is missing
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
            user,
        });
    } catch (error) {
        console.error('GetMe Error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch user profile. Server error.',
        });
    }
};