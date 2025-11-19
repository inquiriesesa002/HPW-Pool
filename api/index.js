// api/index.js - Vercel Serverless Function Entry
const express = require("express");
const serverless = require("serverless-http");
const cors = require("cors");
require("dotenv").config();
const connectDB = require("../config/database");

// Import routes
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

// Connect to MongoDB (cache fix for Vercel)
let isConnected = false;

const connectDBWithCache = async () => {
  if (!isConnected) {
    try {
      await connectDB();
      isConnected = true;
      console.log("MongoDB Connected");
    } catch (error) {
      console.error("Database Error:", error);
    }
  }
};
connectDBWithCache();

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

// Health Check
app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "HPW Pool API running" });
});

// Local development only
if (!process.env.VERCEL) {
  const PORT = 5000;
  app.listen(PORT, () => {
    console.log(`Local API running at http://localhost:${PORT}/api`);
  });
}

// Export for Vercel serverless
module.exports = app;
module.exports.handler = serverless(app);
