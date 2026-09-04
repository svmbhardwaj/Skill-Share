const express = require('express');
const { createReview, getProviderReviews, getServiceReviews } = require('../controllers/reviewController');
const { protect } = require('../middleware/authMiddleware');
const { validate, createReviewSchema } = require('../middleware/validation');

const router = express.Router();

// Create a review (protected, validated)
router.post('/', protect, validate(createReviewSchema), createReview);

// Get reviews for a specific provider (public)
router.get('/provider/:providerId', getProviderReviews);

// Get reviews for a specific service (public)
router.get('/service/:serviceId', getServiceReviews);

module.exports = router;
