// backend/controllers/gigController.js
const Gig = require('../models/gig.js'); // Fixed casing to match actual file
const User = require('../models/User'); 
const mongoose = require('mongoose');

// @desc    Create a new gig
// @route   POST /api/gigs
// @access  Private (requires authentication)
exports.createGig = async (req, res) => {
    if (!req.user || !req.user.id) {
        return res.status(401).json({ success: false, error: 'Not authorized, user not found' });
    }

    const { title, description, category, location } = req.body;

    if (!title || !description || !category || !location || !location.lat || !location.lon) {
        return res.status(400).json({ success: false, error: 'Please include all required gig fields including valid location (lat, lon).' });
    }

    const allowedCategories = [
        'Music Lessons', 'Academic Tutoring', 'Resume Writing', 'Graphic Design',
        'Web Development', 'Photography', 'Cooking Classes', 'Fitness Coaching',
        'Language Lessons', 'Home Repair', 'Gardening', 'Other',
    ];
    if (!allowedCategories.includes(category)) {
        return res.status(400).json({ success: false, error: 'Invalid category provided.' });
    }

    try {
        const gig = await Gig.create({
            title,
            description,
            category,
            location: {
                type: 'Point',
                coordinates: [parseFloat(location.lon), parseFloat(location.lat)],
                address: location.address || ''
            },
            postedBy: req.user.id,
        });

        res.status(201).json({
            success: true,
            data: gig,
            message: 'Gig posted successfully!'
        });

    } catch (error) {
        console.error('Error posting gig:', error);
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ success: false, error: messages.join(', ') });
        }
        res.status(500).json({ success: false, error: 'Server error while posting gig.' });
    }
};

// @desc    Delete a gig
// @route   DELETE /api/gigs/:id
// @access  Private (requires authentication)
exports.deleteGig = async (req, res) => {
    if (!req.user || !req.user.id) {
        return res.status(401).json({ success: false, error: 'Not authorized' });
    }

    try {
        const gig = await Gig.findById(req.params.id);

        if (!gig) {
            return res.status(404).json({ success: false, error: 'Gig not found' });
        }

        // IMPORTANT SECURITY CHECK: Ensure the logged-in user owns this gig
        if (gig.postedBy.toString() !== req.user.id.toString()) {
            return res.status(401).json({ success: false, error: 'Not authorized to delete this gig' });
        }

        await Gig.deleteOne({ _id: req.params.id });

        res.status(200).json({ success: true, message: 'Gig deleted successfully' });

    } catch (error) {
        console.error('Error deleting gig:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({ success: false, error: 'Invalid Gig ID format' });
        }
        res.status(500).json({ success: false, error: 'Server error while deleting gig.' });
    }
};

// @desc    Get all gigs (with optional filtering)
// @route   GET /api/gigs
// @access  Public (no authentication needed for Browse)
exports.getGigs = async (req, res) => {
    try {
        let query = {};

        // Filtering by category (e.g., /api/gigs?category=Music Lessons)
        if (req.query.category) {
            query.category = req.query.category;
        }

        // Filtering by location (e.g., /api/gigs?latitude=X&longitude=Y&radius=Z)
        // This is a more advanced feature. For now, we'll just implement basic
        // parsing, but actual geospatial queries are needed in Gig.find().
        if (req.query.latitude && req.query.longitude && req.query.radius) {
            const { latitude, longitude, radius } = req.query;
            // You'd typically convert radius from km/miles to meters for $maxDistance
            // and use $nearSphere for actual geo-querying.
            // For now, this is just a placeholder to acknowledge the parameters.
            query.location = {
                 $nearSphere: {
                     $geometry: {
                         type: "Point",
                         coordinates: [parseFloat(longitude), parseFloat(latitude)]
                     },
                     $maxDistance: parseFloat(radius) * 1000 // radius in km to meters
                 }
             };
        }

        // You might also want to implement pagination here
        const gigs = await Gig.find(query).populate('postedBy', 'name email'); // Populate user info
        
        res.status(200).json({
            success: true,
            count: gigs.length,
            data: gigs
        });

    } catch (error) {
        console.error('Error fetching gigs:', error);
        res.status(500).json({ success: false, error: 'Server error while fetching gigs.' });
    }
};

// @desc    Get current user's gigs
// @route   GET /api/gigs/my
// @access  Private (requires authentication)
exports.getMyGigs = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ success: false, error: 'Not authorized' });
        }

        const gigs = await Gig.find({ postedBy: req.user.id })
            .populate('postedBy', 'name email')
            .sort({ createdAt: -1 }); // Most recent first

        res.status(200).json({
            success: true,
            count: gigs.length,
            data: gigs
        });

    } catch (error) {
        console.error('Error fetching user gigs:', error);
        res.status(500).json({ success: false, error: 'Server error while fetching your gigs.' });
    }
};