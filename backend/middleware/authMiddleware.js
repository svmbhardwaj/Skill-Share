const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');

exports.protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Reject tokens with a malformed user id (avoids a misleading CastError)
            if (!decoded.id || !mongoose.Types.ObjectId.isValid(decoded.id)) {
                return res.status(401).json({ success: false, error: 'Not authorized, token failed' });
            }

            // Get user from the token and attach to request object
            const user = await User.findById(decoded.id).select('-password');

            if (!user) {
                return res.status(401).json({ success: false, error: 'User not found' });
            }

            // Check tokenVersion — reject if user has invalidated tokens
            // (password change, logout-everywhere, etc.)
            if (decoded.tokenVersion !== undefined && (user.tokenVersion || 0) !== decoded.tokenVersion) {
                return res.status(401).json({ 
                    success: false, 
                    error: 'Token has been revoked. Please log in again.' 
                });
            }

            req.user = user;
            next();

        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({ 
                    success: false, 
                    error: 'Token expired. Please refresh your token or log in again.' 
                });
            }
            return res.status(401).json({ success: false, error: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        return res.status(401).json({ success: false, error: 'Not authorized, no token' });
    }
};