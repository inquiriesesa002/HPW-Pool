const express = require('express');
const router = express.Router();
const {
  getProfessions,
  getProfessionById,
  createProfession,
  updateProfession,
  deleteProfession
} = require('../controllers/professionController.cjs');
const { adminAuth, optionalAuth } = require('../middleware/auth.cjs');

// GET all professions - optional auth (if admin, returns all; otherwise only active)
router.get('/', optionalAuth, getProfessions);

router.get('/:id', getProfessionById);
router.post('/', adminAuth, createProfession);
router.put('/:id', adminAuth, updateProfession);
router.delete('/:id', adminAuth, deleteProfession);

module.exports = router;

