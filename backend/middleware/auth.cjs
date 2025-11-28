const jwt = require('jsonwebtoken');
const User = require('../models/User.cjs');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'No token, authorization denied' 
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Token is not valid' 
      });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ 
      success: false, 
      message: 'Token is not valid',
      error: error.message 
    });
  }
};

const adminAuth = async (req, res, next) => {
  try {
    await auth(req, res, () => {
      if (req.user.role !== 'admin' && req.user.role !== 'Admin') {
        return res.status(403).json({ 
          success: false, 
          message: 'Access denied. Admin only.' 
        });
      }
      next();
    });
  } catch (error) {
    res.status(403).json({ 
      success: false, 
      message: 'Access denied',
      error: error.message 
    });
  }
};

// Optional auth - doesn't fail if no token, but sets req.user if token is valid
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      if (user) {
        req.user = user;
      }
    }
    next();
  } catch (error) {
    // If token is invalid, just continue without setting req.user
    next();
  }
};

module.exports = { auth, adminAuth, optionalAuth };

