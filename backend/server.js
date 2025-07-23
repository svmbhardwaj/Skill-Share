// backend/server.js

// ... (existing code: require('dotenv').config(), express, etc.)

// Connect to MongoDB
connectDB();

const app = express();

// Stripe webhook endpoint needs raw body, so place it before express.json()
app.use('/api/payment/webhook', express.raw({ type: 'application/json' }));

// Middleware to parse JSON bodies
app.use(express.json());

// 🚨 CRITICAL FIX: Configure CORS to allow your Vercel frontend URL
const allowedOrigins = [
    'http://localhost:3000', // For local frontend development
    'https://skill-share-774ulevar-shivam-bhardwajs-projects-d1c28ead.vercel.app', // <--- YOUR DEPLOYED VERCEl FRONTEND URL ADDED HERE
    // Add other frontend domains if you have them (e.g., specific preview branch URLs)
];

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps, Postman, or curl requests)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', // Specify allowed HTTP methods
    credentials: true, // Allow cookies/authorization headers to be sent
    optionsSuccessStatus: 204 // For preflight requests
}));


// --- Mount Routers ---
// ... (rest of your existing routes) ...
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/services', require('./routes/serviceRoutes'));
app.use('/api/jobs', require('./routes/jobRoutes'));
app.use('/api/payment', require('./routes/paymentRoutes'));
app.use('/api/gigs', require('./routes/gigRoutes'));

// Root route to test backend
app.get('/', (req, res) => {
    res.send('✅ Backend is working!');
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Backend server running on port ${PORT}`));