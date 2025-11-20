const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

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

  // Start new connection
  connectionPromise = mongoose.connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 20000, // Reduced timeout for faster response
    socketTimeoutMS: 30000,
    connectTimeoutMS: 20000,
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
        // Wait for connection with timeout
        await Promise.race([
          connectDB(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Connection timeout')), 15000))
        ]);
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

// Import routes
const authRoutes = require('./routes/auth');
const locationRoutes = require('./routes/locations');
const professionRoutes = require('./routes/professions');
const professionalRoutes = require('./routes/professionals');
const companyRoutes = require('./routes/companies');
const jobRoutes = require('./routes/jobs');
const traineeRoutes = require('./routes/trainees');
const uploadRoutes = require('./routes/upload');
const adminRoutes = require('./routes/admin');

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

// Export for Vercel serverless
// Vercel expects the app to be exported directly
module.exports = app;
