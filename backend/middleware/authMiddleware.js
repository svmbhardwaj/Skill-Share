const jwt = require('jsonwebtoken');
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

            // Get user from the token and attach to request object
            req.user = await User.findById(decoded.id).select('-password');
            next();

        } catch (error) {
            return res.status(401).json({ success: false, error: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        return res.status(401).json({ success: false, error: 'Not authorized, no token' });
    }
};