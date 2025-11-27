const express = require('express');
const router = express.Router();
const {
  getTrainees,
  getTraineeById,
  createTrainee,
  updateTrainee
} = require('../controllers/traineeController.cjs');
const { auth } = require('../middleware/auth.cjs');
const { upload } = require('../middleware/upload.cjs');

router.get('/', getTrainees);
router.get('/:id', getTraineeById);
router.post('/', auth, upload.single('avatar'), createTrainee);
router.put('/', auth, upload.single('avatar'), updateTrainee);

module.exports = router;

