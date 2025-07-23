const Job = require('../models/Job');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// @desc    Create a stripe payment intent for a job
// @route   POST /api/payment/create-payment-intent
// @access  Private (Client)
exports.createPaymentIntent = async (req, res) => {
    try {
        const { jobId } = req.body;
        const job = await Job.findById(jobId);

        if (!job || job.client.toString() !== req.user.id) {
            return res.status(404).json({ success: false, error: 'Job not found or not authorized' });
        }

        // Amount must be in the smallest currency unit (e.g., cents)
        const paymentIntent = await stripe.paymentIntents.create({
            amount: job.price * 100,
            currency: 'usd', // or 'eur', 'inr', etc.
            metadata: { jobId: job._id.toString() },
        });

        // Save the intent ID to our job model
        job.paymentIntentId = paymentIntent.id;
        await job.save();

        // Send the client secret back to the frontend
        res.send({
            clientSecret: paymentIntent.client_secret,
        });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};


// @desc    Stripe webhook for successful payments
// @route   POST /api/payment/webhook
// @access  Public (Secured by Stripe signature)
exports.handleStripeWebhook = async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the payment_intent.succeeded event
    if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object;
        const jobId = paymentIntent.metadata.jobId;

        // Update the job status in your database
        await Job.findByIdAndUpdate(jobId, {
            paymentStatus: 'succeeded',
            status: 'paid', // Or another appropriate status
        });
    }

    res.json({ received: true });
};