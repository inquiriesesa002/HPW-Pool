const express = require('express');
const router = express.Router();
const {
  getUsers,
  deleteUser,
  verifyProfessional,
  getAllProfessionals,
  deleteProfessional,
  getAllCompanies,
  verifyCompany,
  deleteCompany,
  getAllJobs,
  deleteJob,
  getLocations,
  createContinent,
  updateContinent,
  deleteContinent,
  createCountry,
  bulkCreateCountries,
  updateCountry,
  deleteCountry,
  getProfessions,
  seedProfessions,
  getAdminStats
} = require('../api/controllers/adminController');
const { protect, authorize } = require('../api/middleware/auth');

// All admin routes require authentication and admin role
router.use(protect);
router.use(authorize('admin'));

// Stats
router.get('/stats', getAdminStats);

// Users
router.get('/users', getUsers);
router.delete('/users/:id', deleteUser);

// Professionals
router.get('/professionals', getAllProfessionals);
router.put('/professionals/:id/verify', verifyProfessional);
router.delete('/professionals/:id', deleteProfessional);

// Companies
router.get('/companies', getAllCompanies);
router.put('/companies/:id/verify', verifyCompany);
router.delete('/companies/:id', deleteCompany);

// Jobs
router.get('/jobs', getAllJobs);
router.delete('/jobs/:id', deleteJob);

// Locations
router.get('/locations', getLocations);

// Continents
router.post('/continents', createContinent);
router.put('/continents/:id', updateContinent);
router.delete('/continents/:id', deleteContinent);

// Countries
router.post('/countries', createCountry);
router.post('/countries/bulk', bulkCreateCountries);
router.put('/countries/:id', updateCountry);
router.delete('/countries/:id', deleteCountry);

// Professions
router.get('/professions', getProfessions);
router.post('/seed-professions', seedProfessions);

module.exports = router;

