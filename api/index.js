// api/index.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// --------------------
// CORS
// --------------------
app.use(cors({
  origin: '*',
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin",
    "email",
    "password",
    "x-access-token"
  ],
  exposedHeaders: ["Content-Range", "X-Content-Range"]
}));

// --------------------
// Body parsers
// --------------------
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

// --------------------
// DB connection
// --------------------
const connectDB = async () => {
  if (mongoose.connection.readyState === 1) return;
  try {
    await mongoose.connect(process.env.MONGODB_URI, { maxPoolSize: 10 });
    console.log('✅ MongoDB Connected Successfully');
  } catch (err) {
    console.error('❌ MongoDB Connection Error:', err);
    throw err;
  }
};

// Middleware to ensure DB is connected
app.use(async (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    try {
      await connectDB();
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Database connection error' });
    }
  }
  next();
});

// --------------------
// Routes
// --------------------
const authRoutes = require('./server/routes/auth.js');
const professionRoutes = require('./server/routes/professions.js');
const professionalRoutes = require('./server/routes/professionals.js');
const companyRoutes = require('./server/routes/companies.js');
const jobRoutes = require('./server/routes/jobs.js');
const traineeRoutes = require('./server/routes/trainees.js');
const adminRoutes = require('./server/routes/admin.js');

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/professions', professionRoutes);
app.use('/api/professionals', professionalRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/trainees', traineeRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/locations', locationRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
    environment: process.env.VERCEL ? 'Vercel' : 'Local'
  });
});

// API root
app.get('/api', (req, res) => {
  res.json({ success: true, message: 'HPW Pool API' });
});

// Catch-all 404
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found', path: req.path });
});

// --------------------
// Local Development Server
// --------------------
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, async () => {
    console.log(`🚀 Server running on port ${PORT}`);
    try {
      await connectDB();
    } catch (err) {
      console.error('❌ DB connection failed:', err);
    }
  });
}

// --------------------
// Export for Vercel
// --------------------
// For Vercel, export the app directly (Vercel handles serverless automatically)
module.exports = process.env.VERCEL ? app : app;
