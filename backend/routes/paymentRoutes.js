const express = require('express');
const { createPaymentIntent, handleStripeWebhook } = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/create-payment-intent', protect, createPaymentIntent);
router.post('/webhook', handleStripeWebhook); // This route must be public

module.exports = router;