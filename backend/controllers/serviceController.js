const Service = require('../models/Service');
const User = require('../models/User');

// @desc    Get services within a certain radius
// @route   GET /api/services?lat=...&lon=...&radius=...
// @access  Public
exports.getNearbyServices = async (req, res) => {
    try {
        const { lat, lon, radius } = req.query;

        if (!lat || !lon || !radius) {
            return res.status(400).json({
                success: false,
                error: 'Latitude, longitude, and radius are required',
            });
        }
        
        const earthRadius = 6378;
        const searchRadius = parseFloat(radius) / earthRadius;

        const nearbyProviders = await User.find({
            location: {
                $geoWithin: {
                    $centerSphere: [[parseFloat(lon), parseFloat(lat)], searchRadius],
                },
            },
        });

        const providerIds = nearbyProviders.map(provider => provider._id);

        const services = await Service.find({ provider: { $in: providerIds } })
            .populate({
                path: 'provider',
                select: 'name verified',
            });
            
        res.status(200).json({
            success: true,
            count: services.length,
            data: services,
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

// @desc    Create a new service/gig
// @route   POST /api/services
// @access  Private
exports.createService = async (req, res) => {
    try {
        const { title, description, category, price, contactInfo } = req.body;
        const provider = req.user.id;

        const service = await Service.create({
            title,
            description,
            category,
            price,
            contactInfo,
            provider,
        });

        res.status(201).json({
            success: true,
            data: service,
        });
    } catch (error) {
        console.error(error);
        res.status(400).json({ success: false, error: error.message });
    }
};

// @desc    Get current user's services/gigs
// @route   GET /api/services/my
// @access  Private
exports.getMyServices = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ success: false, error: 'Not authorized' });
        }

        const services = await Service.find({ provider: req.user.id })
            .populate('provider', 'name email')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: services.length,
            data: services
        });
    } catch (error) {
        console.error('Error fetching user services:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
};

// @desc    Delete a service/gig
// @route   DELETE /api/services/:id
// @access  Private
exports.deleteService = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ success: false, error: 'Not authorized' });
        }

        const service = await Service.findById(req.params.id);

        if (!service) {
            return res.status(404).json({ success: false, error: 'Service not found' });
        }

        // Check ownership
        if (service.provider.toString() !== req.user.id.toString()) {
            return res.status(401).json({ success: false, error: 'Not authorized to delete this service' });
        }

        await Service.deleteOne({ _id: req.params.id });

        res.status(200).json({ success: true, message: 'Service deleted successfully' });
    } catch (error) {
        console.error('Error deleting service:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
};

// @desc    Get a single service by ID
// @route   GET /api/services/:id
// @access  Public
exports.getServiceById = async (req, res) => {
    try {
        const service = await Service.findById(req.params.id).populate({
            path: 'provider',
            select: 'name email',
        });

        if (!service) {
            return res.status(404).json({ success: false, error: 'Service not found' });
        }

        res.status(200).json({ success: true, data: service });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};