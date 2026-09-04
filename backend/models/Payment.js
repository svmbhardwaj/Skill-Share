const mongoose = require('mongoose');

// ============================================================
// PAYMENT MODEL — Razorpay payments linked to a Job
// ============================================================
// The Job carries the workflow state (status state machine) and a
// separate `paymentStatus`. This model records each Razorpay order
// created for a job and its lifecycle (created -> succeeded/failed/cancelled).
const paymentSchema = new mongoose.Schema({
    // The job this payment belongs to
    job: {
        type: mongoose.Schema.ObjectId,
        ref: 'Job',
        required: true,
    },
    // The client who is paying
    client: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true,
    },
    // Razorpay order ID (created server-side, never from the client)
    orderId: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    // Razorpay payment ID — set only after server-side signature verification
    paymentId: {
        type: String,
    },
    // Razorpay signature — set only after server-side signature verification
    signature: {
        type: String,
    },
    // Amount in the currency's smallest unit (paise for INR), derived from the Job server-side
    amount: {
        type: Number,
        required: true,
        min: [1, 'Amount must be at least 1 paise'],
    },
    currency: {
        type: String,
        default: 'INR',
        enum: ['INR'], // INR only — Razorpay payments are INR-denominated
    },
    status: {
        type: String,
        enum: ['created', 'succeeded', 'failed', 'cancelled'],
        default: 'created',
    },
}, {
    timestamps: true,
});

// ============================================================
// INDEXES
// ============================================================
// orderId has a unique index via the field definition (fast lookups
// by Razorpay order ID for verification/reconciliation).
// Active payment per job
paymentSchema.index({ job: 1, status: 1 });

module.exports = mongoose.model('Payment', paymentSchema);