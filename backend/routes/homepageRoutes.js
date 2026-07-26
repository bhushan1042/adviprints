const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authenticate');
const { getHomepage, updateHomepage } = require('../controllers/homepageController');

// Public routes
router.get('/', getHomepage);

// Protected routes
router.post('/', authenticate, updateHomepage);

module.exports = router;
