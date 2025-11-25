const express = require('express');
const router = express.Router();
const {
  getJobs,
  getJobById,
  createJob,
  updateJob,
  deleteJob
} = require('../controllers/jobController.cjs');
const { auth } = require('../middleware/auth.cjs');
const { upload } = require('../middleware/upload.cjs');

router.get('/', getJobs);
router.get('/:id', getJobById);
// Custom middleware to handle optional file upload
const optionalUpload = (req, res, next) => {
  // Check if request has multipart/form-data content type
  if (req.headers['content-type'] && req.headers['content-type'].includes('multipart/form-data')) {
    // Use multer middleware
    upload.single('image')(req, res, next);
  } else {
    // Skip multer for JSON requests
    next();
  }
};

router.post('/', auth, optionalUpload, createJob);
router.put('/:id', auth, optionalUpload, updateJob);
router.delete('/:id', auth, deleteJob);

module.exports = router;

