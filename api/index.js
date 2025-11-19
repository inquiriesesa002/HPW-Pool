Skip to content
Sylvie's projects
Sylvie's projects

Hobby

hpw-pool

6j7mhtQsd


Find…
F

Source
Output
api/index.js

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
hpw-pool – Deployment Source – Vercel
