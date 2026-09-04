const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please add a title'],
        trim: true,
        maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    description: {
        type: String,
        required: [true, 'Please add a description'],
        maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    category: {
        type: String,
        required: [true, 'Please select a category'],
        enum: ['Education', 'Repair', 'Health & Fitness', 'Tech Help', 'Other'],
    },
    price: {
        type: Number,
        required: [true, 'Please add a price'],
        min: [1, 'Price must be at least ₹1'],
    },
    currency: {
        type: String,
        default: 'INR',
        enum: ['INR', 'USD'],
    },
    imageUrl: {
        type: String,
        default: 'https://cdn-icons-png.flaticon.com/512/1055/1055687.png'
    },
    contactInfo: {
        type: String,
        required: [true, 'Please add contact info'],
    },
    provider: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true,
    },
    // Location for geo-search
    location: {
        type: { type: String, enum: ['Point'] },
        coordinates: { type: [Number] },
        address: String,
    },
    // Average rating (denormalized for performance)
    averageRating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
    },
    totalReviews: {
        type: Number,
        default: 0,
    },
    // Soft delete
    isActive: {
        type: Boolean,
        default: true,
    },
}, {
    timestamps: true,
});

// ============================================================
// INDEXES
// ============================================================
// Geo-spatial queries (find services near a location)
serviceSchema.index({ location: '2dsphere' });
// Text search on title and description
serviceSchema.index({ title: 'text', description: 'text' });
// Fast provider lookups
serviceSchema.index({ provider: 1, isActive: 1 });
// Category + active filter
serviceSchema.index({ category: 1, isActive: 1 });
// Sort by latest
serviceSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Service', serviceSchema);