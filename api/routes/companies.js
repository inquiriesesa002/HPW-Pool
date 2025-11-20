const express = require('express');
const router = express.Router();
const {
  getCompanies,
  getCompany,
  createCompany,
  updateCompany
} = require('../api/controllers/companyController');
const { protect } = require('../api/middleware/auth');

router.get('/', getCompanies);
router.get('/:id', getCompany);
router.post('/', protect, createCompany);
router.put('/:id', protect, updateCompany);

module.exports = router;

