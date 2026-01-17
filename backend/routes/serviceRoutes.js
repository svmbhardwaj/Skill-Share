const express = require('express');
const { createService, getNearbyServices, getServiceById, getMyServices, deleteService } = require('../controllers/serviceController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Get current user's services (must be before /:id route)
router.get('/my', protect, getMyServices);

// Route for getting nearby services and creating a new one
router
    .route('/')
    .get(getNearbyServices)
    .post(protect, createService);

// Route for getting/deleting a single service by its ID
router.route('/:id')
    .get(getServiceById)
    .delete(protect, deleteService);

module.exports = router;