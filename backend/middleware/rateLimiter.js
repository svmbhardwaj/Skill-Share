const rateLimit = require('express-rate-limit');

// ============================================================
// Rate limiters for auth endpoints to prevent brute-forcing
// ============================================================

// Strict limiter for login attempts
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // max 10 login attempts per 15 min per IP
    message: {
        success: false,
        error: 'Too many login attempts. Please try again after 15 minutes.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Strict limiter for registration
const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // max 5 registrations per hour per IP
    message: {
        success: false,
        error: 'Too many registration attempts. Please try again after an hour.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Limiter for forgot password to prevent email bombing
const forgotPasswordLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // max 3 reset emails per hour per IP
    message: {
        success: false,
        error: 'Too many password reset requests. Please try again after an hour.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// General API limiter
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per 15 min per IP
    message: {
        success: false,
        error: 'Too many requests. Please slow down.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = {
    loginLimiter,
    registerLimiter,
    forgotPasswordLimiter,
    apiLimiter,
};
