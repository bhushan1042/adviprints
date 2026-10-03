const BrandingSettings = require('../models/BrandingSettings');
const { saveImage } = require('../services/storage');

const BRANDING_FIELDS = ['mainLogo', 'footerLogo', 'mobileLogo', 'favicon', 'darkLogo', 'lightLogo', 'emailLogo'];

// Get current branding settings
const getBranding = async (req, res) => {
  try {
    const b = await BrandingSettings.findOne().sort({ updatedAt: -1 }).lean();
    const out = {};
    for (const field of BRANDING_FIELDS) out[field] = (b && b[field]) || '';
    return res.json(out);
  } catch (err) {
    console.error('[branding] get failed:', err.message);
    res.status(500).json({ error: 'Server Error' });
  }
};

// Update branding (admin). Uploaded files replace the field; otherwise the posted value (or empty) is kept.
const updateBranding = async (req, res, next) => {
  try {
    const files = req.files || {};
    const body = req.body || {};
    const payload = {};

    for (const field of BRANDING_FIELDS) {
      const file = (files[field] || [])[0];
      if (file) {
        payload[field] = (await saveImage(file.buffer, { folder: 'branding', visibility: 'public' })).url;
      } else {
        payload[field] = typeof body[field] === 'string' ? body[field] : '';
      }
    }

    const updated = await BrandingSettings.findOneAndUpdate({}, payload, { upsert: true, new: true, setDefaultsOnInsert: true });
    return res.json({ message: 'Branding updated', branding: updated });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getBranding,
  updateBranding
};
