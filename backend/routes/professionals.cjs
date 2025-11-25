const express = require('express');
const router = express.Router();
const {
  getProfessionals,
  getProfessionalById,
  getStats,
  createProfessional,
  updateProfessional,
  uploadCV
} = require('../controllers/professionalController.cjs');
const { auth } = require('../middleware/auth.cjs');
const { upload } = require('../middleware/upload.cjs');

router.get('/stats', getStats);
router.get('/', getProfessionals);
router.get('/:id', getProfessionalById);
router.post('/', auth, upload.single('avatar'), createProfessional);
router.put('/', auth, upload.single('avatar'), updateProfessional);
router.post('/cv', auth, upload.single('cv'), uploadCV);

module.exports = router;

