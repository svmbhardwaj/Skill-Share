const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
    client: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true,
    },
    provider: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true,
    },
    service: {
        type: mongoose.Schema.ObjectId,
        ref: 'Service',
        required: true,
    },
    // This status is key for "job safety" tracking
    status: {
        type: String,
        required: true,
        enum: ['requested', 'accepted', 'in_progress', 'completed', 'cancelled', 'paid'],
        default: 'requested',
    },
    scheduledDateTime: {
        type: Date,
    },
    price: {
        type: Number,
        required: true,
    },
    // Stripe-related fields
    paymentIntentId: {
        type: String,
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'succeeded', 'failed'],
        default: 'pending',
    },
}, {
    timestamps: true,
});

module.exports = mongoose.model('Job', jobSchema);