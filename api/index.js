// api/index.js - Vercel Serverless Function Entry
try {
  const serverless = require("serverless-http");
  const express = require("express");
  const cors = require("cors");
  require("dotenv").config();

  const connectDB = require("./config/database");

  // Import routes (NOTE: all from ./routes now)
  const authRoutes = require("./routes/auth");
  const locationRoutes = require("./routes/locations");
  const professionRoutes = require("./routes/professions");
  const professionalRoutes = require("./routes/professionals");
  const companyRoutes = require("./routes/companies");
  const jobRoutes = require("./routes/jobs");
  const traineeRoutes = require("./routes/trainees");
  const uploadRoutes = require("./routes/upload");
  const adminRoutes = require("./routes/admin");

  const app = express();

  let isConnected = false;

  const connectDBCached = async () => {
    if (!isConnected) {
      await connectDB();
      isConnected = true;
    }
  };

  connectDBCached().catch(err => console.error(err));

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

  app.get("/api/health", (_, res) => {
    res.json({ success: true, message: "HPW Pool API running" });
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
