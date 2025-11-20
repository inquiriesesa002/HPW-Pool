const express = require('express');
const router = express.Router();
const {
  getJobs,
  getJob,
  createJob,
  updateJob,
  applyToJob,
  downloadCV
} = require('../api/controllers/jobController');
const { protect } = require('../api/middleware/auth');
const { uploadJobImage } = require('../api/middleware/upload');

router.get('/', getJobs);
router.get('/:id', getJob);
router.post('/', protect, uploadJobImage, createJob);
router.put('/:id', protect, uploadJobImage, updateJob);
router.post('/apply', protect, applyToJob);
router.get('/cv/download', protect, downloadCV);

module.exports = router;
