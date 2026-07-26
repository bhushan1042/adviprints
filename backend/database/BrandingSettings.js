const mongoose = require('mongoose');

const brandingSchema = new mongoose.Schema({
  mainLogo: { type: String, default: '' },
  footerLogo: { type: String, default: '' },
  mobileLogo: { type: String, default: '' },
  favicon: { type: String, default: '' },
  darkLogo: { type: String, default: '' },
  lightLogo: { type: String, default: '' },
  emailLogo: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('BrandingSettings', brandingSchema);
