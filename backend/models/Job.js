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
    // Currency for the payment (default INR for India)
    currency: {
        type: String,
        default: 'INR',
        enum: ['INR', 'USD', 'EUR'],
    },
    // Razorpay order ID (created server-side; payment status is separate
    // from the job workflow `status`)
    razorpayOrderId: {
        type: String,
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'succeeded', 'failed', 'refunded'],
        default: 'pending',
    },
    // State machine: track transitions for audit trail
    statusHistory: [{
        from: String,
        to: String,
        changedBy: { type: mongoose.Schema.ObjectId, ref: 'User' },
        changedAt: { type: Date, default: Date.now },
    }],
}, {
    timestamps: true,
});

// ============================================================
// INDEXES for fast dashboard queries
// ============================================================
jobSchema.index({ client: 1, status: 1 });
jobSchema.index({ provider: 1, status: 1 });
jobSchema.index({ service: 1 });
jobSchema.index({ razorpayOrderId: 1 }, { sparse: true });
jobSchema.index({ createdAt: -1 });

// ============================================================
// STATE MACHINE — enforce valid transitions
// ============================================================
const VALID_TRANSITIONS = {
    requested:   ['accepted', 'cancelled'],
    accepted:    ['in_progress', 'paid', 'cancelled'],
    in_progress: ['completed', 'cancelled'],
    completed:   ['paid'],
    paid:        [], // terminal state
    cancelled:   [], // terminal state
};

jobSchema.methods.canTransitionTo = function(newStatus) {
    const allowed = VALID_TRANSITIONS[this.status] || [];
    return allowed.includes(newStatus);
};

jobSchema.methods.transitionTo = function(newStatus, userId) {
    if (!this.canTransitionTo(newStatus)) {
        throw new Error(`Cannot transition from '${this.status}' to '${newStatus}'`);
    }
    
    // Record history
    this.statusHistory.push({
        from: this.status,
        to: newStatus,
        changedBy: userId,
    });
    
    this.status = newStatus;
    return this;
};

module.exports = mongoose.model('Job', jobSchema);