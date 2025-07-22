// backend/controllers/gigController.js
// FIX: Added .js extension to the require path for Gig
const Gig = require('../models/gig.js');
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

// You will add getGigs (for Browse/filtering) here later
// exports.getGigs = async (req, res) => { ... }