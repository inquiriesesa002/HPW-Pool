const express = require('express');
const router = express.Router();
const {
  getTrainees,
  getTrainee,
  createTrainee,
  updateTrainee
} = require('../api/controllers/traineeController');
const { protect } = require('../api/middleware/auth');

router.get('/', getTrainees);
router.get('/:id', getTrainee);
router.post('/', protect, createTrainee);
router.put('/:id', protect, updateTrainee);

module.exports = router;

