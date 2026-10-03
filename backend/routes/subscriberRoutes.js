const express = require('express');
const router = express.Router();
const { publicWriteLimiter } = require('../middleware/rateLimiters');
const { subscribe } = require('../controllers/subscriberController');

router.post('/subscribe', publicWriteLimiter, subscribe);

module.exports = router;
