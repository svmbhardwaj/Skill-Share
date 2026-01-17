// backend/routes/gigRoutes.js
const express = require('express');
const router = express.Router();
const { createGig, getGigs, deleteGig, getMyGigs } = require('../controllers/gigController');
const { protect } = require('../middleware/authMiddleware');

// Define routes
// GET /api/gigs/my - Get current user's gigs (protected) - MUST be before /:id route
router.get('/my', protect, getMyGigs);

// GET /api/gigs - Get all gigs (public)
router.get('/', getGigs);

// POST /api/gigs - Create a new gig (protected, only logged-in users can post)
router.post('/', protect, createGig);

// DELETE /api/gigs/:id - Delete a gig (protected)
router.delete('/:id', protect, deleteGig);

module.exports = router;