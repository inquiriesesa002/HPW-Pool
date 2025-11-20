const mongoose = require("mongoose");

let isConnected = false;       // Track if connection is already established
let connectionPromise = null;  // Promise for ongoing connection attempt

const connectDB = async () => {
  if (isConnected) return;

  if (!connectionPromise) {
    const mongoURI = process.env.MONGODB_URI;
    if (!mongoURI) throw new Error("MONGODB_URI not set in environment");

    connectionPromise = mongoose
      .connect(mongoURI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        connectTimeoutMS: 10000,
      })
      .then(() => {
        isConnected = true;
        console.log("MongoDB Connected");
      })
      .catch((err) => {
        console.error("MongoDB connection error:", err.message);
        connectionPromise = null; // Allow retry next time
        throw err;
      });
  }

  return connectionPromise;
};

module.exports = connectDB;
