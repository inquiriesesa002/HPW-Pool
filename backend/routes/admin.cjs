const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getUsers,
  getProfessionals,
  verifyProfessional,
  getCompanies,
  getJobs,
  getLocations
} = require('../controllers/adminController.cjs');
const { adminAuth } = require('../middleware/auth.cjs');

router.get('/stats', adminAuth, getDashboardStats);
router.get('/users', adminAuth, getUsers);
router.get('/professionals', adminAuth, getProfessionals);
router.put('/professionals/:id/verify', adminAuth, verifyProfessional);
router.get('/companies', adminAuth, getCompanies);
router.get('/jobs', adminAuth, getJobs);
router.get('/locations', adminAuth, getLocations);

module.exports = router;

