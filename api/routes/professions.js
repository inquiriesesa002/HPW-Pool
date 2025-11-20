const express = require('express');
const router = express.Router();
const {
  getProfessions,
  getProfession,
  createProfession,
  updateProfession,
  deleteProfession
} = require('../api/controllers/professionController');
const { protect, authorize } = require('../api/middleware/auth');

router.get('/', getProfessions);
router.get('/:id', getProfession);
router.post('/', protect, authorize('admin'), createProfession);
router.put('/:id', protect, authorize('admin'), updateProfession);
router.delete('/:id', protect, authorize('admin'), deleteProfession);

module.exports = router;

