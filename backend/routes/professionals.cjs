const express = require('express');
const router = express.Router();
const {
  getProfessionals,
  getProfessionalById,
  getStats,
  createProfessional,
  updateProfessional,
  uploadCV,
  toggleProfessionalCard,
  sendMessage,
  getMessages,
  markMessageAsRead,
  markMessageAsUnread,
  getCurrentProfile
} = require('../controllers/professionalController.cjs');
const { auth } = require('../middleware/auth.cjs');
const { upload } = require('../middleware/upload.cjs');

router.get('/stats', getStats);
router.get('/profile', auth, getCurrentProfile);
router.get('/', getProfessionals);
router.post('/', auth, upload.single('avatar'), createProfessional);
router.put('/', auth, upload.single('avatar'), updateProfessional);
router.post('/cv', auth, upload.single('cv'), uploadCV);
router.put('/card', auth, toggleProfessionalCard);
router.put('/messages/:messageId/read', auth, markMessageAsRead);
router.put('/messages/:messageId/unread', auth, markMessageAsUnread);
router.get('/:id/messages', auth, getMessages);
router.post('/:id/message', sendMessage);
router.get('/:id', getProfessionalById);

module.exports = router;

