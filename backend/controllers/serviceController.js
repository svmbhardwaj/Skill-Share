const Service = require('../models/Service');
const User = require('../models/User');

// @desc    Get services — nearby when lat/lon/radius are given, otherwise all active services
// @route   GET /api/services?lat=...&lon=...&radius=...   (params optional)
// @access  Public
exports.getNearbyServices = async (req, res) => {
    try {
        const { lat, lon, radius } = req.query;

        // Location is optional — when the client has no coordinates (geolocation
        // denied or unavailable) we return every active service instead of
        // silently assuming a default location.
        if (!lat || !lon || !radius) {
            const allServices = await Service.find({ isActive: true })
                .populate({
                    path: 'provider',
                    select: 'name verified',
                })
                .sort({ createdAt: -1 });

            return res.status(200).json({
                success: true,
                count: allServices.length,
                data: allServices,
            });
        }

        const parsedLat = parseFloat(lat);
        const parsedLon = parseFloat(lon);
        const parsedRadius = parseFloat(radius);
        if (
            Number.isNaN(parsedLat) || Number.isNaN(parsedLon) || Number.isNaN(parsedRadius)
            || parsedRadius <= 0
        ) {
            return res.status(400).json({
                success: false,
                error: 'Invalid latitude, longitude, or radius',
            });
        }

        const earthRadius = 6378;
        const searchRadius = parsedRadius / earthRadius;

        const nearbyProviders = await User.find({
            location: {
                $geoWithin: {
                    $centerSphere: [[parsedLon, parsedLat], searchRadius],
                },
            },
        });

        const providerIds = nearbyProviders.map(provider => provider._id);

        const services = await Service.find({ provider: { $in: providerIds }, isActive: true })
            .populate({
                path: 'provider',
                select: 'name verified',
            })
            .sort({ createdAt: -1 });

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

// @desc    Create a new service
// @route   POST /api/services
// @access  Private
exports.createService = async (req, res) => {
    try {
        const { title, description, category, price, contactInfo } = req.body;
        const provider = req.user.id;

        // Store the provider's location on the service so every service is geo-searchable
        const providerUser = await User.findById(provider);
        const location = providerUser && providerUser.location && providerUser.location.coordinates
            ? {
                type: 'Point',
                coordinates: providerUser.location.coordinates,
                address: providerUser.location.address || undefined,
            }
            : undefined;

        const service = await Service.create({
            title,
            description,
            category,
            price,
            contactInfo,
            provider,
            location,
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

// @desc    Get current user's services
// @route   GET /api/services/my
// @access  Private
exports.getMyServices = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ success: false, error: 'Not authorized' });
        }

        const services = await Service.find({ provider: req.user.id, isActive: true })
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

// @desc    Delete a service (soft delete — keeps Jobs referencing it intact)
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

        // Soft delete: keep the document so existing Jobs that reference it stay valid
        service.isActive = false;
        await service.save();

        res.status(200).json({ success: true, message: 'Service removed successfully' });
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
        const service = await Service.findOne({ _id: req.params.id, isActive: true }).populate({
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