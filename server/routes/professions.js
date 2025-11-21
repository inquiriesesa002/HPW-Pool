const express = require('express');
const router = express.Router();
const {
  getProfessions,
  getProfession,
  createProfession,
  updateProfession,
  deleteProfession
} = require('../controllers/professionController.cjs');
const { protect, authorize } = require('../middleware/auth.cjs');

router.get('/', getProfessions);
router.get('/:id', getProfession);
router.post('/', protect, authorize('admin'), createProfession);
router.put('/:id', protect, authorize('admin'), updateProfession);
router.delete('/:id', protect, authorize('admin'), deleteProfession);

module.exports = router;

