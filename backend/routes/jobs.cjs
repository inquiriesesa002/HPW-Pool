const express = require('express');
const router = express.Router();
const {
  getJobs,
  getJobById,
  createJob,
  updateJob,
  deleteJob,
  applyJob,
  getJobApplications,
  markApplicationAsViewed
} = require('../controllers/jobController.cjs');
const { auth } = require('../middleware/auth.cjs');
const { upload } = require('../middleware/upload.cjs');

router.get('/', getJobs);
// Applications route must come before /:id route
router.get('/:id/applications', auth, getJobApplications);
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

// Job application route with multiple file uploads
const applicationUpload = upload.fields([
  { name: 'profilePhoto', maxCount: 1 },
  { name: 'resume', maxCount: 1 },
  { name: 'coverLetter', maxCount: 1 },
  { name: 'certificates', maxCount: 10 }
]);
router.post('/apply', auth, applicationUpload, applyJob);

// Mark application as viewed (must come before /:id routes)
router.put('/applications/:applicationId/viewed', auth, markApplicationAsViewed);

module.exports = router;

