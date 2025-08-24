// backend/config/db.js
const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    // Add strictQuery to silence deprecation warnings in newer versions
    mongoose.set("strictQuery", true);

    const conn = await mongoose.connect(process.env.MONGO_URI, {
      // No need for useNewUrlParser / useUnifiedTopology in Mongoose 6+
      serverSelectionTimeoutMS: 5000, // Fail fast if DB is unreachable
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (err) {
    console.error("❌ MongoDB Connection Error:", err.message);

    // Keep Railway happy by exiting if DB connection fails
    process.exit(1);
  }
};

module.exports = connectDB;
