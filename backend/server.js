// backend/server.js

// Load environment variables first
require('dotenv').config();

// ============================================================
// STARTUP VALIDATION — fail fast if critical env vars are missing
// ============================================================
const REQUIRED_ENV_VARS = [
    { name: 'MONGO_URI', hint: 'MongoDB connection string' },
    { name: 'JWT_SECRET', hint: 'JWT signing secret (32+ chars)' },
    { name: 'GOOGLE_CLIENT_ID', hint: 'Google OAuth client ID' },
    { name: 'RAZORPAY_KEY_ID', hint: 'Razorpay test mode key ID' },
    { name: 'RAZORPAY_KEY_SECRET', hint: 'Razorpay test mode key secret (server-only, never exposed to the frontend)' },
];

const missing = REQUIRED_ENV_VARS.filter(v => !process.env[v.name]);
if (missing.length > 0) {
    console.error('\n❌ FATAL: Missing required environment variables:\n');
    missing.forEach(v => {
        console.error(`   • ${v.name} — ${v.hint}`);
    });
    console.error('\n   Copy backend/.env.example to backend/.env and fill in the values.\n');
    process.exit(1);
}

if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    console.error('\n❌ FATAL: JWT_SECRET must be at least 32 characters long for security.\n');
    process.exit(1);
}

const express = require('express');
const cors = require('cors');
const http = require('http');
const jwt = require('jsonwebtoken');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
const User = require('./models/User');
const { apiLimiter } = require('./middleware/rateLimiter');

// Connect to MongoDB
connectDB();

const app = express();
const server = http.createServer(app);

// Trust proxy for deployment platforms (Heroku, Render, Railway, etc.)
app.set('trust proxy', 1);

// ============================================================
// CORS CONFIGURATION
// ============================================================
const allowedOrigins = process.env.ALLOWED_ORIGINS 
    ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
    : ['http://localhost:3000'];

// Optional: Vercel project name for preview deployment matching
const vercelProjectName = process.env.VERCEL_PROJECT_NAME || '';

console.log('Allowed Origins:', allowedOrigins);

const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (mobile apps, curl, etc.)
        if (!origin) return callback(null, true);
        
        // Check exact match
        if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
            return callback(null, true);
        }
        
        // Check for Vercel preview deployments
        if (origin.endsWith('.vercel.app')) {
            if (vercelProjectName && origin.includes(vercelProjectName)) {
                console.log('Allowing Vercel preview deployment:', origin);
                return callback(null, true);
            }
            if (process.env.NODE_ENV !== 'production') {
                console.log('Allowing Vercel preview (dev mode):', origin);
                return callback(null, true);
            }
        }
        
        console.log('CORS blocked origin:', origin);
        callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    preflightContinue: false,
    optionsSuccessStatus: 204
};

// Handle OPTIONS preflight requests explicitly
app.options('*', cors(corsOptions));
app.use(cors(corsOptions));

// ============================================================
// SOCKET.IO — Real-time updates
// ============================================================
const io = new Server(server, {
    cors: corsOptions,
});

// Authenticate every socket connection with the same JWT used by the REST API.
// A user can never join another user's room because the socket identity is
// established at connection time from the verified token.
io.use(async (socket, next) => {
    try {
        const token = socket.handshake && socket.handshake.auth && socket.handshake.auth.token;
        if (!token) {
            return next(new Error('Authentication required'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!decoded || !decoded.id) {
            return next(new Error('Invalid token'));
        }

        const user = await User.findById(decoded.id).select('-password');
        if (!user) {
            return next(new Error('User not found'));
        }

        // Enforce tokenVersion revocation — same rule as the REST protect middleware
        if (decoded.tokenVersion !== undefined && (user.tokenVersion || 0) !== decoded.tokenVersion) {
            return next(new Error('Token has been revoked'));
        }

        // Attach the verified identity to the socket
        socket.user = { id: user._id.toString(), name: user.name };
        next();
    } catch (err) {
        next(new Error('Unauthorized'));
    }
});

// Store io instance on app for use in controllers
app.set('io', io);

io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id);

    // Join a user-specific room for targeted events.
    // A user may ONLY join their own room — the server verifies the request
    // against the authenticated socket identity instead of trusting the client.
    socket.on('join', (userId) => {
        if (!socket.user) return;
        if (userId && String(userId) === socket.user.id) {
            socket.join(`user_${userId}`);
            console.log(`User ${socket.user.id} joined their room`);
        } else {
            console.log(`Rejected join attempt for room user_${userId} (not the authenticated user)`);
        }
    });

    socket.on('disconnect', () => {
        console.log('Socket disconnected:', socket.id);
    });
});

// ============================================================
// MIDDLEWARE
// ============================================================

// Parse JSON bodies
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Apply general rate limiting
app.use('/api/', apiLimiter);

// ============================================================
// MOUNT ROUTERS
// ============================================================
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/services', require('./routes/serviceRoutes'));
app.use('/api/jobs', require('./routes/jobRoutes'));
app.use('/api/payment', require('./routes/paymentRoutes'));
app.use('/api/reviews', require('./routes/reviewRoutes'));

// Health check endpoint for deployment platforms
app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Root route to test backend
app.get('/', (req, res) => {
    res.json({ 
        message: '✅ SkillShare Backend API is running!',
        version: '2.0.0',
        docs: '/api'
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Error:', err.message);
    res.status(err.status || 500).json({
        success: false,
        error: process.env.NODE_ENV === 'production' 
            ? 'An unexpected error occurred' 
            : err.message
    });
});

// Handle 404 routes
app.use((req, res) => {
    res.status(404).json({ success: false, error: 'Route not found' });
});

// Start the server (using http server for Socket.io)
const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Backend server running on port ${PORT}`);
    console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔌 Socket.io enabled for real-time updates`);
});

// Expose app + io for tests and advanced use
module.exports = { app, io };