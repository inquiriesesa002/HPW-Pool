const express = require('express');
const router = express.Router();
const { register, login, getMe } = require('../api/controllers/authController');
const { protect } = require('../api/middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);

module.exports = router;

