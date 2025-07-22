const Job = require('../models/Job');
const Service = require('../models/Service');

// @desc    Create a job request (hire a provider)
// @route   POST /api/jobs/hire
// @access  Private (Client)
exports.createJobRequest = async (req, res) => {
    try {
        const { serviceId, scheduledDateTime } = req.body;
        const service = await Service.findById(serviceId);

        if (!service) {
            return res.status(404).json({ success: false, error: 'Service not found' });
        }

        const job = await Job.create({
            client: req.user.id, // from protect middleware
            provider: service.provider,
            service: serviceId,
            price: service.price,
            scheduledDateTime,
        });

        res.status(201).json({ success: true, data: job });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

// @desc    Update a job's status
// @route   PATCH /api/jobs/:id/status
// @access  Private (Provider or Client)
exports.updateJobStatus = async (req, res) => {
    try {
        const { status } = req.body; // e.g., 'accepted', 'completed'
        const job = await Job.findById(req.params.id);

        if (!job) {
            return res.status(404).json({ success: false, error: 'Job not found' });
        }

        // Authorization check: only provider can accept, only client/provider can complete
        if (status === 'accepted' && job.provider.toString() !== req.user.id) {
             return res.status(401).json({ success: false, error: 'Not authorized to accept this job' });
        }

        job.status = status;
        await job.save();

        res.status(200).json({ success: true, data: job });

    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

// @desc    Get jobs for the current user (as client or provider)
// @route   GET /api/jobs/myjobs
// @access  Private
exports.getMyJobs = async (req, res) => {
    try {
        const jobs = await Job.find({
            $or: [{ client: req.user.id }, { provider: req.user.id }]
        }).populate('service', 'title').populate('client', 'name').populate('provider', 'name');

        res.status(200).json({ success: true, data: jobs });
    } catch (error) {
         res.status(500).json({ success: false, error: 'Server Error' });
    }
}