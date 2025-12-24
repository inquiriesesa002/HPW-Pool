const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getUsers,
  getProfessionals,
  verifyProfessional,
  getCompanies,
  getJobs,
  getLocations,
  createContinent,
  updateContinent,
  deleteContinent,
  createCountry,
  bulkCreateCountries,
  bulkCreateProvinces,
  bulkCreateCities,
  createProvince,
  updateProvince,
  deleteProvince,
  createCity
} = require('../controllers/adminController.cjs');
const { adminAuth } = require('../middleware/auth.cjs');

router.get('/stats', adminAuth, getDashboardStats);
router.get('/users', adminAuth, getUsers);
router.get('/professionals', adminAuth, getProfessionals);
router.put('/professionals/:id/verify', adminAuth, verifyProfessional);
router.get('/companies', adminAuth, getCompanies);
router.get('/jobs', adminAuth, getJobs);
router.get('/locations', adminAuth, getLocations);
router.post('/continents', adminAuth, createContinent);
router.put('/continents/:id', adminAuth, updateContinent);
router.delete('/continents/:id', adminAuth, deleteContinent);
router.post('/countries', adminAuth, createCountry);
router.post('/countries/bulk', adminAuth, bulkCreateCountries);
router.post('/provinces', adminAuth, createProvince);
router.put('/provinces/:id', adminAuth, updateProvince);
router.delete('/provinces/:id', adminAuth, deleteProvince);
router.post('/provinces/bulk', adminAuth, bulkCreateProvinces);
router.post('/cities', adminAuth, createCity);
router.post('/cities/bulk', adminAuth, bulkCreateCities);

module.exports = router;

