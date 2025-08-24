const express = require('express');
const { registerUser, loginUser, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Register a new user
router.post('/register', registerUser);

// Login an existing user
router.post('/login', loginUser);

// Get current user info (protected route)
router.get('/me', protect, getMe);

module.exports = router;
