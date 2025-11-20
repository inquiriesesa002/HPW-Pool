const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { uploadCV, uploadProfileImage, uploadLogo } = require('../middleware/upload');

// CV Upload
router.post('/cv', protect, uploadCV, (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Use Cloudinary URL if available
    const filePath = req.file.cloudinaryUrl || `/uploads/cvs/${req.file.filename}`;
    
    res.json({
      success: true,
      message: 'CV uploaded successfully',
      filePath: filePath,
      fileName: req.file.originalname
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Profile Image Upload
router.post('/profile-image', protect, uploadProfileImage, (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Use Cloudinary URL if available
    const filePath = req.file.cloudinaryUrl || `/uploads/profile-images/${req.file.filename}`;
    
    res.json({
      success: true,
      message: 'Profile image uploaded successfully',
      filePath: filePath,
      fileName: req.file.originalname
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Company Logo Upload
router.post('/logo', protect, uploadLogo, (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Use Cloudinary URL if available
    const filePath = req.file.cloudinaryUrl || `/uploads/company-logos/${req.file.filename}`;
    
    res.json({
      success: true,
      message: 'Logo uploaded successfully',
      filePath: filePath,
      fileName: req.file.originalname
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;

