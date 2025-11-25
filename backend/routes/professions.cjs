const express = require('express');
const router = express.Router();
const professionController = require('../controllers/professionController.cjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User.cjs');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Optional auth middleware - inline to avoid module loading issues
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password');
        if (user) {
          req.user = user;
        }
      } catch (err) {
        // Invalid token, continue without user
      }
    }
    next();
  } catch (error) {
    next();
  }
};

// Get adminAuth from middleware
let adminAuth;
try {
  const authMiddleware = require('../middleware/auth.cjs');
  adminAuth = authMiddleware.adminAuth;
} catch (err) {
  console.error('Error loading auth middleware:', err);
  // Fallback adminAuth
  adminAuth = async (req, res, next) => {
    return res.status(403).json({ success: false, message: 'Admin access required' });
  };
}

// GET all professions - optional auth (if admin, returns all; otherwise only active)
router.get('/', optionalAuth, professionController.getProfessions);

router.get('/:id', professionController.getProfessionById);
router.post('/', adminAuth, professionController.createProfession);
router.put('/:id', adminAuth, professionController.updateProfession);
router.delete('/:id', adminAuth, professionController.deleteProfession);

module.exports = router;

