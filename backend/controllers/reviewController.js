const Review = require('../models/Review');

// Get reviews
const getReviews = async (req, res) => {
  try {
    const { productId } = req.query;
    const q = {};
    if (productId) q.productId = productId;
    const reviews = await Review.find(q).sort({ createdAt: -1 }).lean();
    res.json(reviews);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server Error' });
  }
};

// Create review
const createReview = async (req, res) => {
  try {
    const { productId, rating, comment, userId } = req.body;

    if (!productId || !rating) {
      return res.status(400).json({ error: 'productId and rating required' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'rating must be 1-5' });
    }

    const created = await Review.create({
      productId,
      rating,
      comment: comment || '',
      userId: userId || null
    });

    res.status(201).json(created);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server Error' });
  }
};

module.exports = {
  getReviews,
  createReview
};
