// backend/models/Gig.js
const mongoose = require('mongoose');

const GigSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, 'Please add a gig title'],
            trim: true,
            maxlength: [100, 'Title cannot be more than 100 characters'],
        },
        description: {
            type: String,
            required: [true, 'Please add a description'],
            maxlength: [1000, 'Description cannot be more than 1000 characters'],
        },
        category: {
            type: String,
            required: [true, 'Please select a category'],
            enum: [
                'Music Lessons',
                'Academic Tutoring',
                'Resume Writing',
                'Graphic Design',
                'Web Development',
                'Photography',
                'Cooking Classes',
                'Fitness Coaching',
                'Language Lessons',
                'Home Repair',
                'Gardening',
                'Other',
            ], // Example categories
        },
        location: {
            // GeoJSON Point
            type: {
                type: String,
                enum: ['Point'], // 'location.type' must be 'Point'
                default: 'Point',
                required: true,
            },
            coordinates: {
                type: [Number], // [longitude, latitude]
                required: [true, 'Please add coordinates for the gig location'],
                // index: '2dsphere', // This line is for indexing, which we'll add via schema.index below
            },
            address: String, // Optional: To store a human-readable address
        },
        postedBy: {
            type: mongoose.Schema.ObjectId,
            ref: 'User',
            required: true,
        },
        createdAt: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true, // Adds createdAt and updatedAt automatically
    }
);

// Create a geospatial index for efficient location-based queries
GigSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Gig', GigSchema);