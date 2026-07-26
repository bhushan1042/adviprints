const mongoose = require('mongoose');

const promotionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  code: { type: String, default: null },
  bannerImage: { type: String, default: null },
  active: { type: Boolean, default: true },
  startsAt: { type: Date, default: null },
  endsAt: { type: Date, default: null },
  order: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Promotion', promotionSchema);
