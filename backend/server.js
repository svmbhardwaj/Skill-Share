// backend/server.js

// 🚨 Load environment variables FIRST
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const app = express();

// ✅ Connect to MongoDB
connectDB();

// Stripe webhook endpoint needs raw body → place BEFORE express.json()
app.use("/api/payment/webhook", express.raw({ type: "application/json" }));

// ✅ Middleware to parse JSON
app.use(express.json());

// ✅ CORS Configuration
const allowedOrigins = [
  "http://localhost:3000", // Local frontend
  "https://skill-share-774ulevar-shivam-bhardwajs-projects-d1c28ead.vercel.app", // Vercel frontend
  "https://skill-share-production.up.railway.app", // Railway backend (direct calls)
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) {
        // Allow non-browser requests (like Postman, curl)
        return callback(null, true);
      }
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      console.warn(`❌ Blocked by CORS: ${origin}`);
      return callback(new Error("Not allowed by CORS"), false);
    },
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true,
    optionsSuccessStatus: 204,
  })
);

// ✅ API Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/services", require("./routes/serviceRoutes"));
app.use("/api/jobs", require("./routes/jobRoutes"));
app.use("/api/payment", require("./routes/paymentRoutes"));
app.use("/api/gigs", require("./routes/gigRoutes"));

// ✅ Health Check (for Railway/Vercel)
app.get("/", (req, res) => {
  res.json({ status: "✅ Backend is working!" });
});

// ✅ Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Backend server running on port ${PORT}`);
  console.log(`🌍 Allowed Origins: ${allowedOrigins.join(", ")}`);
});
