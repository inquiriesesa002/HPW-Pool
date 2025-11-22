const mongoose = require("mongoose");

let isConnected = false; // Cache connection

const connectDB = async () => {
  // Already connected → return
  if (isConnected) return;

  // If mongoose connection is active → return
  if (mongoose.connection.readyState === 1) {
    isConnected = true;
    return;
  }

  const mongoURI = process.env.MONGODB_URI;

  if (!mongoURI) {
    throw new Error("❌ MONGODB_URI missing in environment variables");
  }

  try {
    const conn = await mongoose.connect(mongoURI, {
      maxPoolSize: 5, // Safe for serverless
    });

    isConnected = true;
    console.log("✅ MongoDB Connected:", conn.connection.host);

  } catch (err) {
    console.error("❌ MongoDB Error:", err.message);
    throw err; // Don’t exit — let Vercel handle it
  }
};

module.exports = connectDB;
