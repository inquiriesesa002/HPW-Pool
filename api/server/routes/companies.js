const express = require('express');
const router = express.Router();
const {
  getCompanies,
  getCompany,
  createCompany,
  updateCompany
} = require('../controllers/companyController.cjs');
const { protect } = require('../middleware/auth.cjs');

router.get('/', getCompanies);
router.get('/:id', getCompany);
router.post('/', protect, createCompany);
router.put('/:id', protect, updateCompany);

module.exports = router;

