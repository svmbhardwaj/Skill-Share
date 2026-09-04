const { z } = require('zod');

// ============================================================
// AUTH SCHEMAS
// ============================================================

const registerSchema = z.object({
    name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters').max(128, 'Password too long'),
    // Location is OPTIONAL — users can register without granting geolocation permission
    lat: z.number().min(-90).max(90).optional(),
    lon: z.number().min(-180).max(180).optional(),
});

const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
});

const forgotPasswordSchema = z.object({
    email: z.string().email('Invalid email address'),
});

const resetPasswordSchema = z.object({
    token: z.string().min(1, 'Token is required'),
    password: z.string().min(6, 'Password must be at least 6 characters').max(128, 'Password too long'),
});

const updateProfileSchema = z.object({
    name: z.string().min(1, 'Name is required').max(100, 'Name too long').optional(),
});

const googleAuthSchema = z.object({
    credential: z.string().min(1, 'Google credential is required'),
    lat: z.number().min(-90).max(90).optional(),
    lon: z.number().min(-180).max(180).optional(),
});

// ============================================================
// SERVICE SCHEMAS
// ============================================================

const createServiceSchema = z.object({
    title: z.string().min(1, 'Title is required').max(100, 'Title too long'),
    description: z.string().min(1, 'Description is required').max(1000, 'Description too long'),
    category: z.enum(['Education', 'Repair', 'Health & Fitness', 'Tech Help', 'Other'], {
        errorMap: () => ({ message: 'Invalid category' }),
    }),
    price: z.number().positive('Price must be positive'),
    contactInfo: z.string().min(1, 'Contact info is required'),
});

// ============================================================
// JOB SCHEMAS
// ============================================================

const hireSchema = z.object({
    serviceId: z.string().min(1, 'Service ID is required'),
    scheduledDateTime: z.string().datetime().optional(),
});

const updateJobStatusSchema = z.object({
    status: z.enum(['accepted', 'in_progress', 'completed', 'cancelled'], {
        errorMap: () => ({ message: 'Invalid status' }),
    }),
});

// ============================================================
// PAYMENT SCHEMAS
// ============================================================

const createOrderSchema = z.object({
    jobId: z.string().min(1, 'Job ID is required'),
});

const verifyPaymentSchema = z.object({
    orderId: z.string().min(1, 'Razorpay order ID is required'),
    paymentId: z.string().min(1, 'Razorpay payment ID is required'),
    signature: z.string().min(1, 'Razorpay signature is required'),
});

const updatePaymentStatusSchema = z.object({
    orderId: z.string().min(1, 'Razorpay order ID is required'),
    event: z.enum(['failed', 'cancelled'], {
        errorMap: () => ({ message: 'Invalid payment event' }),
    }),
});

// ============================================================
// REVIEW SCHEMAS
// ============================================================

const createReviewSchema = z.object({
    jobId: z.string().min(1, 'Job ID is required'),
    rating: z.number().int().min(1, 'Rating must be at least 1').max(5, 'Rating cannot exceed 5'),
    comment: z.string().max(500, 'Review too long').optional(),
});

// ============================================================
// VALIDATION MIDDLEWARE
// ============================================================

/**
 * Express middleware factory that validates req.body against a Zod schema.
 * Returns 400 with structured error messages on validation failure.
 */
const validate = (schema) => (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
        const errors = result.error.errors.map(err => err.message);
        return res.status(400).json({
            success: false,
            error: errors.join(', '),
        });
    }
    // Replace req.body with validated + coerced data
    req.body = result.data;
    next();
};

module.exports = {
    // Auth
    registerSchema,
    loginSchema,
    forgotPasswordSchema,
    resetPasswordSchema,
    updateProfileSchema,
    googleAuthSchema,
    // Service
    createServiceSchema,
    // Job
    hireSchema,
    updateJobStatusSchema,
    // Payment
    createOrderSchema,
    verifyPaymentSchema,
    updatePaymentStatusSchema,
    // Review
    createReviewSchema,
    // Middleware
    validate,
};
