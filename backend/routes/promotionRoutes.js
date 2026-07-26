const express = require('express');
const router = express.Router();
const { getPromotions } = require('../controllers/promotionController');

// Public routes
router.get('/', getPromotions);

module.exports = router;
