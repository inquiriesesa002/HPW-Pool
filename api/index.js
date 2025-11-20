// api/index.js - Vercel Serverless Function Entry
try {
  const serverless = require("serverless-http");
  const express = require("express");
  const cors = require("cors");
  require("dotenv").config();
  const connectDB = require("../backend/config/database");

  // Import routes
  const authRoutes = require("../backend/routes/auth");
  const locationRoutes = require("../backend/routes/locations");
  const professionRoutes = require("../backend/routes/professions");
  const professionalRoutes = require("../backend/routes/professionals");
  const companyRoutes = require("../backend/routes/companies");
  const jobRoutes = require("../backend/routes/jobs");
  const traineeRoutes = require("../backend/routes/trainees");
  const uploadRoutes = require("../backend/routes/upload");
  const adminRoutes = require("../backend/routes/admin");

  const app = express();

  // Connect to MongoDB (fix for serverless repeated connections)
  let isConnected = false;

  const connectDBCached = async () => {
    if (!isConnected) {
      try {
        await connectDB();
        isConnected = true;
        console.log("MongoDB Connected");
      } catch (err) {
        console.error("MongoDB Error:", err);
        // Don't throw in serverless - let requests handle gracefully
      }
    }
  };

  // Initialize connection (non-blocking)
  connectDBCached().catch(err => {
    console.error("Failed to initialize DB connection:", err);
  });

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Routes
  app.use("/api/auth", authRoutes);
  app.use("/api/locations", locationRoutes);
  app.use("/api/professions", professionRoutes);
  app.use("/api/professionals", professionalRoutes);
  app.use("/api/companies", companyRoutes);
  app.use("/api/jobs", jobRoutes);
  app.use("/api/trainees", traineeRoutes);
  app.use("/api/upload", uploadRoutes);
  app.use("/api/admin", adminRoutes);

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ success: true, message: "HPW Pool API running" });
  });

  // Root API endpoint
  app.get("/", (req, res) => {
    res.json({ success: true, message: "HPW Pool API - Use /api routes" });
  });

  // Error handling middleware
  app.use((err, req, res, next) => {
    console.error("Error:", err);
    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Internal Server Error",
      ...(process.env.NODE_ENV === "development" && { stack: err.stack })
    });
  });

  // Export for Vercel serverless function
  module.exports = serverless(app);
} catch (error) {
  console.error("Error initializing serverless function:", error);
  // Export a minimal error handler
  module.exports = async (req, res) => {
    res.status(500).json({
      success: false,
      message: "Server initialization error",
      error: error.message
    });
  };
}

