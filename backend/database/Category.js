const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  slug: { type: String, unique: true, sparse: true },
  description: { type: String },
  // image used on homepage slider
  imageUrl: { type: String },
  // banner image used on category detail page
  bannerImageUrl: { type: String },
  // Showcase fields used by the homepage ProductShowcase
  showcaseTitle: { type: String },
  showcaseSubtitle: { type: String },
  showcaseFeatures: { type: [String], default: [] },
  showcaseCtaText: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Category', categorySchema);