const serverless = require("serverless-http");
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/database");

// Import routes
const authRoutes = require("./routes/auth");
const jobRoutes = require("./routes/jobs");

const app = express();

// DB cache
let isConnected = false;
let connectionPromise = null;
const connectDBCached = async () => {
  if (isConnected) return;

  if (!connectionPromise) {
    connectionPromise = connectDB()
      .then(() => {
        isConnected = true;
        console.log("MongoDB Connected");
      })
      .catch((err) => {
        console.error("MongoDB connection error:", err.message);
        connectionPromise = null;
        throw err;
      });
  }

  return connectionPromise;
};

// Middleware: lazy connect DB, skip health check
app.use(async (req, res, next) => {
  if (req.path === "/api/health" || req.path === "/api") return next();

  try {
    await connectDBCached();
    next();
  } catch (err) {
    console.error("DB connection failed:", err.message);
    res.status(500).json({ success: false, message: "DB connection failed" });
  }
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/jobs", jobRoutes);

// Health check
app.get("/api/health", (_, res) => {
  res.json({
    success: true,
    message: "HPW Pool API running",
    database: isConnected ? "connected" : "connecting",
  });
});

module.exports = serverless(app);
