// backend/server.js

// Load environment variables first
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db'); // Assumes db.js is in /config

// Connect to MongoDB
connectDB();

const app = express();

// Trust proxy for deployment platforms (Heroku, Render, Railway, etc.)
app.set('trust proxy', 1);

// Stripe webhook endpoint needs raw body, so place it before express.json()
// (This is correctly placed, as raw body is needed before JSON parsing for webhooks)
app.use('/api/payment/webhook', express.raw({ type: 'application/json' }));

// Middleware to parse JSON bodies
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Enable Cross-Origin Resource Sharing (CORS) with production configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS 
    ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
    : ['http://localhost:3000'];

console.log('Allowed Origins:', allowedOrigins); // Debug log

// Handle OPTIONS preflight requests explicitly
app.options('*', cors());

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (mobile apps, curl, etc.)
        if (!origin) return callback(null, true);
        
        // Check exact match
        if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
            return callback(null, true);
        }
        
        // Check for Vercel preview deployments (pattern: *-shivam-bhardwajs-projects-d1c28ead.vercel.app)
        if (origin.includes('shivam-bhardwajs-projects') && origin.includes('vercel.app')) {
            console.log('Allowing Vercel preview deployment:', origin);
            return callback(null, true);
        }
        
        console.log('CORS blocked origin:', origin); // Debug log
        callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    preflightContinue: false,
    optionsSuccessStatus: 204
}));

// --- Mount Routers ---
// These routes will now have access to process.env.JWT_SECRET
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/services', require('./routes/serviceRoutes'));
app.use('/api/jobs', require('./routes/jobRoutes'));
app.use('/api/payment', require('./routes/paymentRoutes'));
app.use('/api/gigs', require('./routes/gigRoutes'));

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
        version: '1.0.0',
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

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Backend server running on port ${PORT}`);
    console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
});