try {
  const serverless = require("serverless-http");
  const express = require("express");
  const cors = require("cors");
  require("dotenv").config();

  const connectDB = require("./config/database");

  // Import routes
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

  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Health check (does not wait for DB)
  app.get("/api/health", (_, res) => {
    res.json({ success: true, message: "HPW Pool API running" });
  });

  // Routes: Lazy connect to DB only when needed
  app.use("/api/auth", async (req, res, next) => {
    try {
      await connectDB();
      authRoutes(req, res, next);
    } catch (err) {
      console.error("DB connection failed:", err.message);
      res.status(500).json({ success: false, message: "DB connection failed" });
    }
  });

  app.use("/api/locations", async (req, res, next) => {
    try {
      await connectDB();
      locationRoutes(req, res, next);
    } catch (err) {
      console.error("DB connection failed:", err.message);
      res.status(500).json({ success: false, message: "DB connection failed" });
    }
  });

  // Repeat for other routes similarly
  app.use("/api/professions", async (req, res, next) => { await connectDB().then(() => professionRoutes(req, res, next)).catch(err => res.status(500).json({success:false,message:"DB connection failed"})); });
  app.use("/api/professionals", async (req, res, next) => { await connectDB().then(() => professionalRoutes(req, res, next)).catch(err => res.status(500).json({success:false,message:"DB connection failed"})); });
  app.use("/api/companies", async (req, res, next) => { await connectDB().then(() => companyRoutes(req, res, next)).catch(err => res.status(500).json({success:false,message:"DB connection failed"})); });
  app.use("/api/jobs", async (req, res, next) => { await connectDB().then(() => jobRoutes(req, res, next)).catch(err => res.status(500).json({success:false,message:"DB connection failed"})); });
  app.use("/api/trainees", async (req, res, next) => { await connectDB().then(() => traineeRoutes(req, res, next)).catch(err => res.status(500).json({success:false,message:"DB connection failed"})); });
  app.use("/api/upload", async (req, res, next) => { await connectDB().then(() => uploadRoutes(req, res, next)).catch(err => res.status(500).json({success:false,message:"DB connection failed"})); });
  app.use("/api/admin", async (req, res, next) => { await connectDB().then(() => adminRoutes(req, res, next)).catch(err => res.status(500).json({success:false,message:"DB connection failed"})); });

  const handler = serverless(app);
  module.exports = handler;

} catch (error) {
  module.exports = (_, res) => {
    res.status(500).json({
      success: false,
      message: "Server initialization error",
      error: error.message,
    });
  };
}
