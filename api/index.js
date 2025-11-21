const path = require("path");
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

// --------------------
// CORS
// --------------------
app.use(
  cors({
    origin: "*",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  })
);

// --------------------
// Body Parsers
// --------------------
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));

// --------------------
// DB Connection
// --------------------
const connectDB = async () => {
  if (mongoose.connection.readyState === 1) return;

  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      maxPoolSize: 10,
    });
    console.log("✅ MongoDB Connected");
  } catch (err) {
    console.error("❌ DB Error:", err);
  }
};

// Auto-connect DB
app.use(async (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    await connectDB();
  }
  next();
});

// --------------------
// LOAD ROUTES SAFELY
// --------------------
const load = (route) =>
  require(path.join(__dirname, "server", "routes", route));

// Use Routes
app.use("/api/auth", load("auth"));
app.use("/api/professions", load("professions"));
app.use("/api/professionals", load("professionals"));
app.use("/api/companies", load("companies"));
app.use("/api/jobs", load("jobs"));
app.use("/api/trainees", load("trainees"));
app.use("/api/admin", load("admin"));
app.use("/api/locations", load("locations"));

// --------------------
// Health Check
// --------------------
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    db: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    env: process.env.VERCEL ? "Vercel" : "Local",
    time: new Date().toISOString(),
  });
});

// API Root
app.get("/api", (req, res) => {
  res.json({ success: true, message: "HPW Pool API Root" });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    path: req.path,
  });
});

// LOCAL SERVER (only for localhost)
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, async () => {
    console.log("🚀 Local server running on", PORT);
    await connectDB();
  });
}

// Export for Vercel
module.exports = app;
