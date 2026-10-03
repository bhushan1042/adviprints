const express = require('express');
const router = express.Router();
const { authLimiter } = require('../middleware/rateLimiters');
const { register, login } = require('../controllers/authController');

// Public routes
router.post('/register-submit', authLimiter, register);
router.post('/login-submit', authLimiter, login);

module.exports = router;
