// api/index.js - Vercel Serverless Function Entry
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
    }
  }
};
connectDBCached();

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

// Export for Vercel serverless function
module.exports = app;
module.exports.handler = serverless(app);

