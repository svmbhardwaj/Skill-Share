// backend/routes/gigRoutes.js
const express = require('express');
const router = express.Router();
const { createGig } = require('../controllers/gigController'); // Import the gig controller functions
const { protect } = require('../middleware/authMiddleware'); // Import the auth middleware

// Define routes
// POST /api/gigs - Create a new gig (protected, only logged-in users can post)
router.post('/', protect, createGig);

// You will add GET /api/gigs here later for Browse/filtering
// router.get('/', getGigs);

module.exports = router;