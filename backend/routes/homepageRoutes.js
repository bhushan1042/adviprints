const express = require('express');
const router = express.Router();
const { requireAdmin } = require('../middleware/authenticate');
const { getHomepage, updateHomepage } = require('../controllers/homepageController');

// Public routes
router.get('/', getHomepage);

// Protected routes
router.post('/', requireAdmin, updateHomepage);

module.exports = router;
