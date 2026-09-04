const Review = require('../models/Review');
const Job = require('../models/Job');
const Service = require('../models/Service');

// Recompute a service's denormalized rating fields from its reviews
const refreshServiceRating = async (serviceId) => {
    const [stats] = await Review.aggregate([
        { $match: { service: serviceId } },
        { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]);

    await Service.findByIdAndUpdate(serviceId, {
        averageRating: stats ? Math.round(stats.avg * 10) / 10 : 0,
        totalReviews: stats ? stats.count : 0,
    });
};

// @desc    Create a review for a completed job
// @route   POST /api/reviews
// @access  Private (Client only, after job is completed/paid)
exports.createReview = async (req, res) => {
    try {
        const { jobId, rating, comment } = req.body;

        // Find the job
        const job = await Job.findById(jobId).populate('service');
        if (!job) {
            return res.status(404).json({ success: false, error: 'Job not found' });
        }

        // Only the client can review
        if (job.client.toString() !== req.user.id) {
            return res.status(403).json({ success: false, error: 'Only the client can review this job' });
        }

        // Job must be completed (paid)
        if (job.status !== 'paid' && job.status !== 'completed') {
            return res.status(400).json({ success: false, error: 'Can only review completed/paid jobs' });
        }

        // Check for existing review
        const existingReview = await Review.findOne({ job: jobId, reviewer: req.user.id });
        if (existingReview) {
            return res.status(400).json({ success: false, error: 'You have already reviewed this job' });
        }

        const review = await Review.create({
            job: jobId,
            service: job.service._id || job.service,
            reviewer: req.user.id,
            reviewee: job.provider,
            rating,
            comment,
        });

        // Keep the denormalized Service rating fields accurate
        await refreshServiceRating(review.service);

        res.status(201).json({ success: true, data: review });
    } catch (error) {
        console.error('Create Review Error:', error);
        res.status(500).json({ success: false, error: 'Server error while creating review' });
    }
};

// @desc    Get reviews for a specific provider
// @route   GET /api/reviews/provider/:providerId
// @access  Public
exports.getProviderReviews = async (req, res) => {
    try {
        const reviews = await Review.find({ reviewee: req.params.providerId })
            .populate('reviewer', 'name avatar')
            .populate('service', 'title')
            .sort({ createdAt: -1 });

        // Calculate average rating
        const avgRating = reviews.length > 0
            ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
            : 0;

        res.status(200).json({
            success: true,
            count: reviews.length,
            averageRating: Math.round(avgRating * 10) / 10,
            data: reviews,
        });
    } catch (error) {
        console.error('Get Reviews Error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
};

// @desc    Get reviews for a specific service
// @route   GET /api/reviews/service/:serviceId
// @access  Public
exports.getServiceReviews = async (req, res) => {
    try {
        const reviews = await Review.find({ service: req.params.serviceId })
            .populate('reviewer', 'name avatar')
            .sort({ createdAt: -1 });

        const avgRating = reviews.length > 0
            ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
            : 0;

        res.status(200).json({
            success: true,
            count: reviews.length,
            averageRating: Math.round(avgRating * 10) / 10,
            data: reviews,
        });
    } catch (error) {
        console.error('Get Service Reviews Error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
};
