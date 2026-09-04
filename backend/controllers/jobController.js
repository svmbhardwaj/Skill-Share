const Job = require('../models/Job');
const Service = require('../models/Service');

// @desc    Create a new job/hire request
// @route   POST /api/jobs/hire
// @access  Private (Client)
exports.createJobRequest = async (req, res) => {
    try {
        const { serviceId, scheduledDateTime } = req.body;

        const service = await Service.findById(serviceId).lean();
        if (!service) {
            return res.status(404).json({ success: false, error: 'Service not found' });
        }

        // Can't hire a removed (soft-deleted) service
        if (service.isActive === false) {
            return res.status(400).json({ success: false, error: 'This service is no longer available' });
        }

        // Can't hire yourself
        if (service.provider.toString() === req.user.id) {
            return res.status(400).json({ success: false, error: 'You cannot hire yourself' });
        }

        // Check for existing active job for same service by same client
        const existingJob = await Job.findOne({
            client: req.user.id,
            service: serviceId,
            status: { $nin: ['cancelled', 'completed', 'paid'] },
        }).lean();

        if (existingJob) {
            return res.status(400).json({ success: false, error: 'You already have an active request for this service' });
        }

        const job = await Job.create({
            client: req.user.id,
            provider: service.provider,
            service: serviceId,
            price: service.price,
            currency: service.currency || 'INR',
            scheduledDateTime: scheduledDateTime ? new Date(scheduledDateTime) : undefined,
            statusHistory: [{
                from: null,
                to: 'requested',
                changedBy: req.user.id,
            }],
        });

        // Notify the provider via Socket.io
        if (req.app.get('io')) {
            req.app.get('io').to(`user_${service.provider}`).emit('newJobRequest', {
                jobId: job._id,
                serviceTitle: service.title,
                clientName: req.user.name,
            });
        }

        res.status(201).json({ success: true, data: job });
    } catch (error) {
        console.error('Create Job Error:', error);
        res.status(500).json({ success: false, error: 'Server error creating job request' });
    }
};

// @desc    Update job status (with state machine validation)
// @route   PATCH /api/jobs/:id/status
// @access  Private (Client/Provider depending on transition)
exports.updateJobStatus = async (req, res) => {
    try {
        const { status: newStatus } = req.body;
        const job = await Job.findById(req.params.id);

        if (!job) {
            return res.status(404).json({ success: false, error: 'Job not found' });
        }

        // Authorization: only client or provider can update
        const isClient = job.client.toString() === req.user.id;
        const isProvider = job.provider.toString() === req.user.id;

        if (!isClient && !isProvider) {
            return res.status(403).json({ success: false, error: 'Not authorized to update this job' });
        }

        // Money state (paymentStatus) is NEVER reachable through this endpoint —
        // it can only change after server-side Razorpay signature verification.
        // Permission checks for specific transitions:
        if (newStatus === 'accepted' && !isProvider) {
            return res.status(403).json({ success: false, error: 'Only the provider can accept a job' });
        }
        if (newStatus === 'in_progress' && !isProvider) {
            return res.status(403).json({ success: false, error: 'Only the provider can start a job' });
        }
        if (newStatus === 'completed' && !isProvider) {
            return res.status(403).json({ success: false, error: 'Only the provider can mark a job as completed' });
        }

        // Use state machine for validation
        try {
            job.transitionTo(newStatus, req.user.id);
        } catch (err) {
            return res.status(400).json({ success: false, error: err.message });
        }

        await job.save();

        // Notify the other party via Socket.io
        const io = req.app.get('io');
        if (io) {
            const notifyUserId = isClient ? job.provider : job.client;
            io.to(`user_${notifyUserId}`).emit('jobUpdate', {
                jobId: job._id,
                status: newStatus,
                changedBy: req.user.id,
            });
        }

        res.status(200).json({ success: true, data: job });
    } catch (error) {
        console.error('Update Job Status Error:', error);
        res.status(500).json({ success: false, error: 'Server error updating job status' });
    }
};

// @desc    Get all jobs for the current user (client or provider)
// @route   GET /api/jobs/myjobs
// @access  Private
exports.getMyJobs = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;
        const statusFilter = req.query.status;

        const query = {
            $or: [
                { client: req.user.id },
                { provider: req.user.id },
            ],
        };

        if (statusFilter) {
            query.status = statusFilter;
        }

        const [jobs, total] = await Promise.all([
            Job.find(query)
                .populate('service', 'title category imageUrl')
                .populate('client', 'name avatar')
                .populate('provider', 'name avatar')
                .sort({ updatedAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Job.countDocuments(query),
        ]);

        res.status(200).json({
            success: true,
            data: jobs,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('Get My Jobs Error:', error);
        res.status(500).json({ success: false, error: 'Server error fetching jobs' });
    }
};