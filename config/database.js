const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Use environment variable for MongoDB URI, fallback to local for development
    const mongoURI = process.env.MONGODB_URI || 'mongodb+srv://inquiriesesa_db_user:9OOQm5boLEOdNZsi@cluster0.ktqsjbu.mongodb.net/?appName=Cluster0';
    
    if (!mongoURI || mongoURI === 'mongodb+srv://inquiriesesa_db_user:9OOQm5boLEOdNZsi@cluster0.ktqsjbu.mongodb.net/?appName=Cluster0') {
      console.warn('Warning: Using default MongoDB URI. Set MONGODB_URI environment variable for production.');
    }
    
    const conn = await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Error connecting to MongoDB:', error.message);
    console.error('MongoDB URI:', process.env.MONGODB_URI ? 'Set (hidden)' : 'Not set');
    // Don't exit in serverless environment, let Vercel handle it
    if (process.env.NODE_ENV === 'production' && process.env.VERCEL) {
      throw error;
    }
    process.exit(1);
  }
};

module.exports = connectDB;
