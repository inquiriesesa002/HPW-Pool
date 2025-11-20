const express = require('express');
const router = express.Router();
const {
  getJobs,
  getJob,
  createJob,
  updateJob,
  applyToJob,
  downloadCV
} = require('../../controllers/jobController');
const { protect } = require('../../middleware/auth');
const { uploadJobImage } = require('../../middleware/upload');

router.get('/', getJobs);
router.get('/:id', getJob);
router.post('/', protect, uploadJobImage, createJob);
router.put('/:id', protect, uploadJobImage, updateJob);
router.post('/apply', protect, applyToJob);
router.get('/cv/download', protect, downloadCV);

module.exports = router;
