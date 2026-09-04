const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    // The job this review is for
    job: {
        type: mongoose.Schema.ObjectId,
        ref: 'Job',
        required: true,
    },
    // The service associated with the job
    service: {
        type: mongoose.Schema.ObjectId,
        ref: 'Service',
        required: true,
    },
    // The user who wrote the review (client)
    reviewer: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true,
    },
    // The user being reviewed (provider)
    reviewee: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true,
    },
    // Rating from 1-5
    rating: {
        type: Number,
        required: [true, 'Please add a rating between 1 and 5'],
        min: 1,
        max: 5,
    },
    // Written review
    comment: {
        type: String,
        maxlength: [500, 'Review cannot be more than 500 characters'],
    },
}, {
    timestamps: true,
});

// Prevent duplicate reviews — one review per job per reviewer
reviewSchema.index({ job: 1, reviewer: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);
