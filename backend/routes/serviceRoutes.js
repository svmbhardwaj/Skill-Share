const express = require('express');
// This single line imports all necessary functions
const { createService, getNearbyServices, getServiceById } = require('../controllers/serviceController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Route for getting nearby services and creating a new one
router
    .route('/')
    .get(getNearbyServices)
    .post(protect, createService);

// Route for getting a single service by its ID
router.route('/:id').get(getServiceById);

module.exports = router;