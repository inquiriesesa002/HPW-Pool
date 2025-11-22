const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://inquiriesesa_db_user:9OOQm5boLEOdNZsi@cluster0.ktqsjbu.mongodb.net/?appName=Cluster0';

// Connection state
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
    serverSelectionTimeoutMS: 20000,
    socketTimeoutMS: 30000,
    connectTimeoutMS: 20000,
    retryWrites: true,
    w: 'majority',
    maxPoolSize: 10,
    minPoolSize: 1,
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

module.exports = { connectDB, MONGODB_URI };

