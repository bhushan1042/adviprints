const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/authController');

// Public routes
router.post('/register-submit', register);
router.post('/login-submit', login);

module.exports = router;
