const express = require('express');
const { registerUser, loginUser, getMe, googleAuth, forgotPassword, resetPassword, updateProfile, refreshToken, logoutEverywhere } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { loginLimiter, registerLimiter, forgotPasswordLimiter } = require('../middleware/rateLimiter');
const { validate, registerSchema, loginSchema, googleAuthSchema, forgotPasswordSchema, resetPasswordSchema, updateProfileSchema } = require('../middleware/validation');

const router = express.Router();

router.post('/register', registerLimiter, validate(registerSchema), registerUser);
router.post('/login', loginLimiter, validate(loginSchema), loginUser);
router.post('/google', loginLimiter, validate(googleAuthSchema), googleAuth);
router.post('/forgot-password', forgotPasswordLimiter, validate(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), resetPassword);
router.post('/refresh-token', refreshToken); // Refresh access token
router.post('/logout-everywhere', protect, logoutEverywhere); // Invalidate all tokens
router.get('/me', protect, getMe);
router.put('/update-profile', protect, validate(updateProfileSchema), updateProfile);

module.exports = router;