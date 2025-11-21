const express = require('express');
const router = express.Router();
const {
  getTrainees,
  getTrainee,
  createTrainee,
  updateTrainee
} = require('../controllers/traineeController.js');
const { protect } = require('../middleware/auth.cjs');

router.get('/', getTrainees);
router.get('/:id', getTrainee);
router.post('/', protect, createTrainee);
router.put('/:id', protect, updateTrainee);

module.exports = router;

