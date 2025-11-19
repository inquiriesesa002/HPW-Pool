const mongoose = require('mongoose');
require('dotenv').config();
const User = require('../models/User');

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://inquiriesesa_db_user:9OOQm5boLEOdNZsi@cluster0.ktqsjbu.mongodb.net/?appName=Cluster0');
    console.log('MongoDB Connected...');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@gmail.com' });
    
    if (existingAdmin) {
      // Update existing admin
      existingAdmin.role = 'admin';
      existingAdmin.isVerified = true;
      existingAdmin.isActive = true;
      existingAdmin.password = 'admin123'; // Will be hashed by pre-save hook
      await existingAdmin.save();
      console.log('✅ Admin user updated successfully!');
      console.log('   Email: admin@gmail.com');
      console.log('   Password: admin123');
      console.log('   Role: admin');
    } else {
      // Create new admin
      const admin = await User.create({
        name: 'Admin',
        email: 'admin@gmail.com',
        password: 'admin123',
        role: 'admin',
        isVerified: true,
        isActive: true,
        phone: ''
      });
      console.log('✅ Admin user created successfully!');
      console.log('   Email: admin@gmail.com');
      console.log('   Password: admin123');
      console.log('   Role: admin');
      console.log('   ID:', admin._id);
    }

    process.exit(0);
  } catch (error) {
    console.error('Error creating admin:', error);
    process.exit(1);
  }
};

createAdmin();

