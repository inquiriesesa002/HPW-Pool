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
router.post('/', auth, upload.single('image'), createJob);
router.put('/:id', auth, upload.single('image'), updateJob);
router.delete('/:id', auth, deleteJob);

module.exports = router;

