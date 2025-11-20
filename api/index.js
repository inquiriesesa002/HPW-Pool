const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files for uploads (CVs, job images, etc.)
// NOTE: On Vercel, we cannot use local file storage - only Cloudinary
// Only enable local uploads in local development
if (!process.env.VERCEL) {
  const uploadsDir = path.join(__dirname, '..', 'uploads');
  try {
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
      console.log(`📁 Created uploads directory at ${uploadsDir}`);
    }
    app.use('/uploads', express.static(uploadsDir));
  } catch (dirError) {
    console.error('⚠️ Failed to ensure uploads directory exists:', dirError);
  }
} else {
  console.log('📦 Vercel environment detected - using Cloudinary only (no local storage)');
}

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://inquiriesesa_db_user:9OOQm5boLEOdNZsi@cluster0.ktqsjbu.mongodb.net/?appName=Cluster0';

// Connect to MongoDB (for Vercel serverless)
let isConnected = false;
let connectionPromise = null;

const connectDB = async () => {
  // If already connected, return immediately
  if (mongoose.connection.readyState === 1) {
    isConnected = true;
    return;
  }

  // If connection is in progress, wait for it
  if (connectionPromise) {
    return connectionPromise;
  }

  // Start new connection - REMOVED TIMEOUTS for serverless (STEP-6)
  connectionPromise = mongoose.connect(MONGODB_URI, {
    retryWrites: true,
    w: 'majority',
    maxPoolSize: 10, // Maintain up to 10 socket connections
    minPoolSize: 1, // Maintain at least 1 socket connection
  }).then(() => {
    isConnected = true;
    console.log('✅ MongoDB Connected Successfully');
    connectionPromise = null;
  }).catch((error) => {
    console.error('❌ MongoDB Connection Error:', error);
    isConnected = false;
    connectionPromise = null;
    throw error;
  });

  return connectionPromise;
};

// Initialize connection (non-blocking)
connectDB().catch(err => {
  console.error('Initial MongoDB connection failed:', err);
});

// Middleware to ensure MongoDB connection before handling requests
app.use(async (req, res, next) => {
  try {
    // Log all requests for debugging (only in development)
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[${req.method}] ${req.originalUrl || req.path}`);
    }
    
    // Ensure MongoDB is connected before processing any request
    if (mongoose.connection.readyState !== 1) {
      console.log('MongoDB not connected, attempting connection...');
      try {
        // Wait for connection (no timeout for serverless)
        await connectDB();
        console.log('MongoDB connection established in middleware');
      } catch (connectError) {
        console.error('Failed to connect MongoDB in middleware:', connectError);
        // Continue anyway - route handlers will handle the error
      }
    }
    next();
  } catch (error) {
    console.error('MongoDB connection error in middleware:', error);
    // Continue anyway - some routes might work with cached data
    next();
  }
});

// Import routes - Updated paths (STEP-2)
const authRoutes = require('../routes/auth.cjs');
const locationRoutes = require('../routes/locations.cjs');
const professionRoutes = require('../routes/professions.cjs');
const professionalRoutes = require('../routes/professionals.cjs');
const companyRoutes = require('../routes/companies.cjs');
const jobRoutes = require('../routes/jobs.cjs');
const traineeRoutes = require('../routes/trainees.cjs');
const uploadRoutes = require('../routes/upload.cjs');
const adminRoutes = require('../routes/admin.cjs');

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/professions', professionRoutes);
app.use('/api/professionals', professionalRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/trainees', traineeRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/admin', adminRoutes);

// Health check - handle both /api/health and /health
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'HPW Pool API is running',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'HPW Pool API is running',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    success: true,
    message: 'HPW Pool API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      locations: '/api/locations',
      professions: '/api/professions',
      professionals: '/api/professionals',
      companies: '/api/companies',
      jobs: '/api/jobs',
      trainees: '/api/trainees',
      upload: '/api/upload',
      admin: '/api/admin'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false, 
    message: 'Something went wrong!', 
    error: err.message 
  });
});

// 404 handler
app.use((req, res) => {
  console.log('❌ 404 - Route not found:', req.method, req.path, req.originalUrl);
  res.status(404).json({
    success: false,
    message: 'Route not found',
    method: req.method,
    path: req.path,
    originalUrl: req.originalUrl,
    hint: 'Check available endpoints at /'
  });
});

// Export for Vercel serverless (STEP-1)
// Vercel expects the app to be exported directly
// NO app.listen() - Vercel doesn't allow it (STEP-1)
module.exports = app;

