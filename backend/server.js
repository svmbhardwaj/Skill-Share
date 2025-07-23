// backend/server.js

// 🚨 CRITICAL FIX: Ensure dotenv.config() is the ABSOLUTE FIRST THING called
// This loads your environment variables (like JWT_SECRET) BEFORE any other modules
// that might need them are required.
require('dotenv').config();
console.log('Backend JWT_SECRET (from .env):', process.env.JWT_SECRET); // TEMPORARY DEBUG LINE
// ... rest of your server.js

const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db'); // Assumes db.js is in /config

// Connect to MongoDB
connectDB();

const app = express();

// Stripe webhook endpoint needs raw body, so place it before express.json()
// (This is correctly placed, as raw body is needed before JSON parsing for webhooks)
app.use('/api/payment/webhook', express.raw({ type: 'application/json' }));

// Middleware to parse JSON bodies
app.use(express.json());

// Enable Cross-Origin Resource Sharing (CORS)
app.use(cors());

// --- Mount Routers ---
// These routes will now have access to process.env.JWT_SECRET
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/services', require('./routes/serviceRoutes'));
app.use('/api/jobs', require('./routes/jobRoutes'));
app.use('/api/payment', require('./routes/paymentRoutes'));
app.use('/api/gigs', require('./routes/gigRoutes')); // <--- THIS IS THE LINE THAT WAS MISSING!

// Root route to test backend
app.get('/', (req, res) => {
    res.send('✅ Backend is working!');
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Backend server running on port ${PORT}`));