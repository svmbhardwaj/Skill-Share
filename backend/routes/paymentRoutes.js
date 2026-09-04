const express = require('express');
const { createOrder, verifyPayment, updatePaymentStatus } = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');
const { validate, createOrderSchema, verifyPaymentSchema, updatePaymentStatusSchema } = require('../middleware/validation');

const router = express.Router();

// Create a Razorpay order for a job (protected)
router.post('/create-order', protect, validate(createOrderSchema), createOrder);

// Verify Razorpay signature and mark the job as paid (protected)
router.post('/verify', protect, validate(verifyPaymentSchema), verifyPayment);

// Report a cancelled/failed payment (protected, reconciled server-side)
router.post('/status', protect, validate(updatePaymentStatusSchema), updatePaymentStatus);

module.exports = router;