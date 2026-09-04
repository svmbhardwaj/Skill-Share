// backend/controllers/paymentController.js
const crypto = require('crypto');
const Razorpay = require('razorpay');
const Payment = require('../models/Payment');
const Job = require('../models/Job');

// Initialize Razorpay client (TEST MODE via Razorpay dashboard keys)
// RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET are validated at server startup
// and are never exposed to the frontend. Only RAZORPAY_KEY_ID is public.
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Convert a Job's price to the currency's smallest unit (INR -> paise)
const toSmallestUnit = (amount, currency) => {
    return Math.round(amount * 100); // paise for INR, cents for USD/EUR
};

// @desc    Create a Razorpay order for a job
// @route   POST /api/payment/create-order
// @access  Private (Client)
exports.createOrder = async (req, res) => {
    try {
        const { jobId } = req.body;

        // Always fetch the Job from the DB — never trust an amount from the client
        const job = await Job.findById(jobId).populate('service', 'title');

        if (!job) {
            return res.status(404).json({ success: false, error: 'Job not found' });
        }

        if (job.client.toString() !== req.user.id) {
            return res.status(403).json({ success: false, error: 'Not authorized — only the client can pay' });
        }

        // Prevent duplicate payment for an already-paid job
        if (job.paymentStatus === 'succeeded' || job.status === 'paid') {
            return res.status(400).json({ success: false, error: 'This job has already been paid for' });
        }

        if (!job.canTransitionTo('paid')) {
            return res.status(400).json({
                success: false,
                error: `Cannot pay for a job in '${job.status}' status`,
            });
        }

        // If an order was already created for this job, reuse it (idempotent)
        const existingPayment = await Payment.findOne({ job: job._id, status: 'created' });
        if (existingPayment) {
            return res.status(200).json({
                success: true,
                orderId: existingPayment.orderId,
                amount: existingPayment.amount,
                currency: existingPayment.currency,
                keyId: process.env.RAZORPAY_KEY_ID,
            });
        }

        // Determine the amount server-side from the Job (INR -> paise)
        const currency = job.currency || 'INR';
        const amount = toSmallestUnit(job.price, currency);

        // Create the Razorpay order (test mode)
        const order = await razorpay.orders.create({
            amount,
            currency,
            receipt: `job_${job._id}`,
            notes: {
                jobId: job._id.toString(),
                serviceTitle: job.service?.title || 'Service Payment',
            },
        });

        // Store the Razorpay order ID on the Job
        job.razorpayOrderId = order.id;
        job.paymentStatus = 'pending';
        await job.save();

        // Record the payment (amount derived server-side)
        await Payment.create({
            job: job._id,
            client: req.user.id,
            orderId: order.id,
            amount,
            currency,
            status: 'created',
        });

        res.status(200).json({
            success: true,
            orderId: order.id,
            amount,
            currency,
            keyId: process.env.RAZORPAY_KEY_ID, // public key, needed by the checkout
        });
    } catch (error) {
        console.error('Razorpay Create Order Error:', error);
        res.status(500).json({ success: false, error: 'Failed to create payment order' });
    }
};

// @desc    Verify Razorpay payment signature and mark the job as paid
// @route   POST /api/payment/verify
// @access  Private (Client)
exports.verifyPayment = async (req, res) => {
    try {
        const { orderId, paymentId, signature } = req.body;

        const payment = await Payment.findOne({ orderId });
        if (!payment) {
            return res.status(404).json({ success: false, error: 'Payment order not found' });
        }

        const job = await Job.findById(payment.job);
        if (!job) {
            return res.status(404).json({ success: false, error: 'Job not found' });
        }

        // Only the client who paid can verify
        if (payment.client.toString() !== req.user.id) {
            return res.status(403).json({ success: false, error: 'Not authorized' });
        }

        // Idempotent — already verified
        if (payment.status === 'succeeded' || job.paymentStatus === 'succeeded') {
            return res.status(200).json({ success: true, alreadyPaid: true });
        }

        // Verify the signature ON THE SERVER — never trust the client.
        // Razorpay signs `${orderId}|${paymentId}` with the Key Secret (HMAC-SHA256).
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(`${orderId}|${paymentId}`)
            .digest('hex');
        const receivedSignature = Buffer.from(signature, 'utf8');
        const expectedBuffer = Buffer.from(expectedSignature, 'utf8');
        const isValid = receivedSignature.length === expectedBuffer.length
            && crypto.timingSafeEqual(expectedBuffer, receivedSignature);

        if (!isValid) {
            payment.status = 'failed';
            await payment.save();
            job.paymentStatus = 'failed';
            await job.save();
            return res.status(400).json({ success: false, error: 'Payment signature verification failed' });
        }

        // Mark payment as succeeded
        payment.paymentId = paymentId;
        payment.signature = signature;
        payment.status = 'succeeded';
        await payment.save();

        // Keep the job workflow state machine — only flip paymentStatus + transition if allowed
        if (job.paymentStatus !== 'succeeded' && job.status !== 'paid') {
            job.paymentStatus = 'succeeded';
            if (job.canTransitionTo('paid')) {
                job.transitionTo('paid', req.user.id);
            }
            await job.save();
        }

        // Notify both parties in real-time
        if (req.app.get('io')) {
            const update = { jobId: job._id, status: job.status, paymentStatus: 'succeeded' };
            req.app.get('io').to(`user_${job.client}`).emit('jobUpdate', update);
            req.app.get('io').to(`user_${job.provider}`).emit('jobUpdate', update);
        }

        res.status(200).json({ success: true, paymentStatus: 'succeeded', jobStatus: job.status });
    } catch (error) {
        console.error('Razorpay Verify Error:', error);
        res.status(500).json({ success: false, error: 'Failed to verify payment' });
    }
};

// @desc    Handle cancelled / failed payments (called from the checkout modal)
// @route   POST /api/payment/status
// @access  Private (Client)
// The client only reports what happened in the checkout; the server
// reconciles with Razorpay's authoritative order status before recording it.
exports.updatePaymentStatus = async (req, res) => {
    try {
        const { orderId, event } = req.body;

        const payment = await Payment.findOne({ orderId });
        if (!payment) {
            return res.status(404).json({ success: false, error: 'Payment order not found' });
        }

        if (payment.client.toString() !== req.user.id) {
            return res.status(403).json({ success: false, error: 'Not authorized' });
        }

        // Never downgrade a succeeded payment
        if (payment.status === 'succeeded') {
            return res.status(200).json({ success: true, status: payment.status });
        }

        const job = await Job.findById(payment.job);
        if (!job) {
            return res.status(404).json({ success: false, error: 'Job not found' });
        }

        // Reconcile with Razorpay — the order status is authoritative
        let razorpayOrderStatus = 'CREATED';
        try {
            const order = await razorpay.orders.fetch(orderId);
            razorpayOrderStatus = order.status; // CREATED | ATTEMPTED | PAID
        } catch (err) {
            console.error('Razorpay order fetch failed:', err.message);
        }

        // If Razorpay says the order is PAID, don't mark it failed/cancelled
        if (razorpayOrderStatus === 'PAID') {
            return res.status(200).json({ success: true, status: 'succeeded' });
        }

        const newStatus = event === 'failed' ? 'failed' : 'cancelled';
        payment.status = newStatus;
        await payment.save();

        // Job payment status stays separate from the job workflow state
        if (newStatus === 'failed') {
            job.paymentStatus = 'failed';
            await job.save();
        }
        // Cancelled: order was created but never paid — leave job.paymentStatus as 'pending'

        res.status(200).json({ success: true, status: newStatus });
    } catch (error) {
        console.error('Update Payment Status Error:', error);
        res.status(500).json({ success: false, error: 'Failed to update payment status' });
    }
};