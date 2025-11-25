const express = require('express');
const router = express.Router();
const professionController = require('../controllers/professionController.cjs');
const authMiddleware = require('../middleware/auth.cjs');

// GET all professions - optional auth (if admin, returns all; otherwise only active)
router.get('/', authMiddleware.optionalAuth, professionController.getProfessions);

router.get('/:id', professionController.getProfessionById);
router.post('/', authMiddleware.adminAuth, professionController.createProfession);
router.put('/:id', authMiddleware.adminAuth, professionController.updateProfession);
router.delete('/:id', authMiddleware.adminAuth, professionController.deleteProfession);

module.exports = router;

