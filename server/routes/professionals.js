const express = require('express');
const router = express.Router();
const {
  getProfessionals,
  getProfessional,
  createProfessional,
  updateProfessional,
  getStats,
  uploadCV
} = require('../controllers/professionalController.cjs');
const { protect } = require('../middleware/auth.cjs');
const { uploadCV: cvUploadMiddleware } = require('../middleware/upload.cjs');

const path = require('path');
const fs = require('fs');

router.get('/stats', getStats);
router.get('/', getProfessionals);
router.get('/:id', getProfessional);
router.post('/', protect, createProfessional);
router.put('/:id', protect, updateProfessional);
router.post('/upload-cv', protect, cvUploadMiddleware, uploadCV);

// Download CV (for companies)
router.get('/:id/cv', protect, async (req, res) => {
  try {
    const Professional = require('../models/Professional.cjs');
    const professional = await Professional.findById(req.params.id);
    
    if (!professional || !professional.cv) {
      return res.status(404).json({
        success: false,
        message: 'CV not found'
      });
    }
    
    const cvPath = path.join(__dirname, '..', professional.cv);
    
    if (!fs.existsSync(cvPath)) {
      return res.status(404).json({
        success: false,
        message: 'CV file not found on server'
      });
    }
    
    const fileName = professional.cvFileName || 'cv.pdf';
    res.download(cvPath, fileName);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;

