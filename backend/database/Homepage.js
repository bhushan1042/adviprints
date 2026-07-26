const mongoose = require('mongoose');

const slideSchema = new mongoose.Schema({
  imageUrl: { type: String, required: true },
  caption: { type: String, default: '' },
  ctaText: { type: String, default: '' },
  ctaUrl: { type: String, default: '' },
  order: { type: Number, default: 0 },
}, { _id: false });

const homepageSchema = new mongoose.Schema({
  title: { type: String, default: '' },
  // New primary storage for slides with metadata
  bannerSlides: [slideSchema],
  // Backwards-compatible simple array (strings) — migrated when present
  bannerImages: [{ type: String }],
}, { timestamps: true });

module.exports = mongoose.model('Homepage', homepageSchema);
