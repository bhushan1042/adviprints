const express = require('express');
const router = express.Router();
const { subscribe } = require('../controllers/subscriberController');

// Public routes
router.post('/subscribe', subscribe);

module.exports = router;
