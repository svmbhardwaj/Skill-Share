const express = require('express');
const { registerUser, loginUser, getMe } = require('../controllers/authController'); // Corrected: NO 'S'
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', protect, getMe);

module.exports = router;