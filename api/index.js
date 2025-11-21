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
// Vercel Path Handling Middleware (for production)
// --------------------
app.use((req, res, next) => {
  const originalPath = req.path;
  const originalUrl = req.url;
  
  // Log incoming request for debugging
  if (process.env.VERCEL || process.env.DEBUG) {
    console.log(`[Request] ${req.method} ${originalPath} | URL: ${originalUrl} | Headers:`, {
      'x-vercel-path': req.headers['x-vercel-path'],
      'x-invoke-path': req.headers['x-invoke-path'],
      'x-rewrite-url': req.headers['x-rewrite-url']
    });
  }
  
  // Priority 1: Check Vercel-specific headers for original path
  const vercelPath = req.headers['x-vercel-path'] || req.headers['x-invoke-path'] || req.headers['x-rewrite-url'];
  if (vercelPath) {
    const cleanPath = vercelPath.split('?')[0];
    req.path = cleanPath;
    req.url = vercelPath;
    req.originalUrl = vercelPath;
    if (process.env.VERCEL || process.env.DEBUG) {
      console.log(`[Vercel] Using path from header: ${req.method} ${originalPath} -> ${req.path}`);
    }
    return next();
  }
  
  // Priority 2: Check if path already has /api prefix
  if (req.path.startsWith('/api') || req.path === '/') {
    return next();
  }
  
  // Priority 3: If path doesn't start with /api and it's not root, add /api prefix
  if (req.path !== '/' && !req.path.startsWith('/api')) {
    req.path = '/api' + req.path;
    req.url = '/api' + req.url;
    req.originalUrl = '/api' + originalUrl;
    if (process.env.VERCEL || process.env.DEBUG) {
      console.log(`[Vercel] Added /api prefix: ${req.method} ${originalPath} -> ${req.path}`);
    }
  }
  
  next();
});

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
let authRoutes, professionRoutes, professionalRoutes, companyRoutes, jobRoutes, traineeRoutes, adminRoutes, locationRoutes;

try {
  authRoutes = require('./server/routes/auth.js');
  professionRoutes = require('./server/routes/professions.js');
  professionalRoutes = require('./server/routes/professionals.js');
  companyRoutes = require('./server/routes/companies.js');
  jobRoutes = require('./server/routes/jobs.js');
  traineeRoutes = require('./server/routes/trainees.js');
  adminRoutes = require('./server/routes/admin.js');
  locationRoutes = require('./server/routes/locations.js');
} catch (error) {
  console.error('❌ Error loading routes:', error.message);
  console.error('Stack:', error.stack);
  throw error;
}

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
// Vercel automatically handles serverless functions
// Export the Express app directly
module.exports = app;
