const mongoose = require('mongoose');
const Review = require('../models/Review');

// Get reviews
const getReviews = async (req, res) => {
  try {
    const { productId } = req.query;
    const q = {};
    if (productId !== undefined) {
      if (typeof productId !== 'string' || !mongoose.isValidObjectId(productId)) {
        return res.status(400).json({ error: 'Invalid productId' });
      }
      q.productId = productId;
    }
    const reviews = await Review.find(q).sort({ createdAt: -1 }).lean();
    res.json(reviews);
  } catch (err) {
    console.error('[reviews] list failed:', err.message);
    res.status(500).json({ error: 'Server Error' });
  }
};

// Create review
const createReview = async (req, res) => {
  try {
    const { productId, comment, userId } = req.body;
    const rating = Number(req.body.rating);

    if (!productId || !req.body.rating) {
      return res.status(400).json({ error: 'productId and rating required' });
    }
    if (typeof productId !== 'string' || !mongoose.isValidObjectId(productId)) {
      return res.status(400).json({ error: 'Invalid productId' });
    }
    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'rating must be 1-5' });
    }

    const created = await Review.create({
      productId,
      rating,
      comment: typeof comment === 'string' ? comment.trim().slice(0, 1000) : '',
      userId: typeof userId === 'string' && mongoose.isValidObjectId(userId) ? userId : null
    });

    res.status(201).json(created);
  } catch (err) {
    console.error('[reviews] create failed:', err.message);
    res.status(500).json({ error: 'Server Error' });
  }
};

module.exports = {
  getReviews,
  createReview
};
