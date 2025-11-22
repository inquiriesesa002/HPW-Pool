const express = require('express');
const router = express.Router();
const {
  getProfessions,
  getProfessionById,
  createProfession
} = require('../controllers/professionController.cjs');
const { adminAuth } = require('../middleware/auth.cjs');

router.get('/', getProfessions);
router.get('/:id', getProfessionById);
router.post('/', adminAuth, createProfession);

module.exports = router;

