// api/index.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// --- MIDDLEWARE ---
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// --- DATABASE CONNECTION ---
const connectDB = async () => {
  if (mongoose.connection.readyState === 1) return; // already connected

  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
    });
    console.log('✅ MongoDB Connected Successfully');
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error);
    throw error;
  }
};

// Middleware to ensure DB connection
app.use(async (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    try {
      await connectDB();
    } catch (err) {
      console.error('DB connection failed in middleware:', err);
      return res.status(500).json({ success: false, message: 'Database connection error' });
    }
  }
  next();
});

// --- SAFE ROUTE LOADING ---
const expressSafeRequire = (path) => {
  try {
    return require(path);
  } catch (err) {
    console.warn(`⚠️ Route not found: ${path}, using empty router.`);
    return express.Router();
  }
};

const authRoutes = expressSafeRequire('./routes/auth.js');
const locationRoutes = expressSafeRequire('./routes/locations.js');
const professionRoutes = expressSafeRequire('./routes/professions.js');
const professionalRoutes = expressSafeRequire('./routes/professionals.js');
const companyRoutes = expressSafeRequire('./routes/companies.js');
const jobRoutes = expressSafeRequire('./routes/jobs.js');
const traineeRoutes = expressSafeRequire('./routes/trainees.js');
const uploadRoutes = expressSafeRequire('./routes/upload.js');
const adminRoutes = expressSafeRequire('./routes/admin.js');

// --- ROUTES ---
app.use('/api/auth', authRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/professions', professionRoutes);
app.use('/api/professionals', professionalRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/trainees', traineeRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/admin', adminRoutes);

// --- HEALTH CHECK ---
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
    environment: process.env.VERCEL ? 'Vercel' : 'Local'
  });
});

// --- API ROOT ---
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'HPW Pool API',
    endpoints: {
      auth: '/api/auth',
      locations: '/api/locations',
      professions: '/api/professions',
      professionals: '/api/professionals',
      companies: '/api/companies',
      jobs: '/api/jobs',
      trainees: '/api/trainees',
      upload: '/api/upload',
      admin: '/api/admin',
      health: '/api/health'
    }
  });
});

// --- SERVERLESS ROOT ---
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'HPW Pool API - Serverless Function',
    endpoints: {
      api: '/api',
      health: '/api/health'
    }
  });
});

// --- ERROR HANDLING ---
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: err.message
  });
});

// --- 404 HANDLER ---
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.path
  });
});

// --- START SERVER FOR LOCAL DEVELOPMENT ---
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, async () => {
    console.log(`🚀 HPW Pool Server running on port ${PORT}`);
    try {
      await connectDB();
    } catch (error) {
      console.error('Failed to connect to database on startup:', error);
    }
  });
}

// --- EXPORT APP FOR VERCEL ---
module.exports = app;
