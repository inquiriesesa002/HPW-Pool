const express = require('express');
const router = express.Router();
const {
  getCompanies,
  getCompanyById,
  getMyCompany,
  createCompany,
  updateCompany
} = require('../controllers/companyController.cjs');
const { auth } = require('../middleware/auth.cjs');
const { upload } = require('../middleware/upload.cjs');

router.get('/', getCompanies);
router.get('/me', auth, getMyCompany); // Must come before /:id route
router.get('/:id', getCompanyById);
router.post('/', auth, upload.single('logo'), createCompany);
router.put('/', auth, upload.single('logo'), updateCompany);

module.exports = router;

