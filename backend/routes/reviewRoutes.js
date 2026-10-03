const express = require('express');
const router = express.Router();
const { publicWriteLimiter } = require('../middleware/rateLimiters');
const { getReviews, createReview } = require('../controllers/reviewController');

router.get('/', getReviews);
router.post('/', publicWriteLimiter, createReview);

module.exports = router;
