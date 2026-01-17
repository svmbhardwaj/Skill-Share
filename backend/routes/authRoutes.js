const express = require('express');
const { registerUser, loginUser, getMe, googleAuth, forgotPassword, resetPassword, updateProfile } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/google', googleAuth); // Google OAuth route
router.post('/forgot-password', forgotPassword); // Forgot password route
router.post('/reset-password', resetPassword); // Reset password route
router.get('/me', protect, getMe);
router.put('/update-profile', protect, updateProfile); // Update profile route

module.exports = router;