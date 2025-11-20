// api/index.js - Vercel Serverless Function Entry
try {
  const serverless = require("serverless-http");
  const express = require("express");
  const cors = require("cors");
  require("dotenv").config();

  const connectDB = require("../config/database");

  // Import routes (NOTE: all from ./routes now)
  const authRoutes = require("../routes/auth");
  const locationRoutes = require("../routes/locations");
  const professionRoutes = require("../routes/professions");
  const professionalRoutes = require("../routes/professionals");
  const companyRoutes = require("../routes/companies");
  const jobRoutes = require("../routes/jobs");
  const traineeRoutes = require("../routes/trainees");
  const uploadRoutes = require("../routes/upload");
  const adminRoutes = require("../routes/admin");

  const app = express();

  // Database connection cache
  let isConnected = false;
  let connectionPromise = null;

  const connectDBCached = async () => {
    if (isConnected) {
      return;
    }
    
    if (!connectionPromise) {
      connectionPromise = connectDB()
        .then(() => {
          isConnected = true;
          console.log("MongoDB Connected");
        })
        .catch(err => {
          console.error("MongoDB Connection Error:", err);
          connectionPromise = null; // Reset on error to allow retry
          throw err;
        });
    }
    
    return connectionPromise;
  };

  // Middleware to ensure DB connection before routes
  app.use(async (req, res, next) => {
    // Skip DB connection for health check
    if (req.path === '/api/health' || req.path === '/api') {
      return next();
    }
    
    try {
      await connectDBCached();
      next();
    } catch (err) {
      console.error("DB connection failed:", err);
      // Continue anyway - let routes handle errors
      next();
    }
  });

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

  app.get("/api/health", async (_, res) => {
    try {
      // Try to check DB connection without blocking
      if (isConnected) {
        res.json({ 
          success: true, 
          message: "HPW Pool API running",
          database: "connected"
        });
      } else {
        res.json({ 
          success: true, 
          message: "HPW Pool API running",
          database: "connecting"
        });
      }
    } catch (err) {
      res.json({ 
        success: true, 
        message: "HPW Pool API running",
        database: "error"
      });
    }
  });

  const handler = serverless(app);
  module.exports = handler;

} catch (error) {
  module.exports = (_, res) => {
    res.status(500).json({
      success: false,
      message: "Server initialization error",
      error: error.message
    });
  };
}
