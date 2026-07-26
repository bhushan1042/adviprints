const BrandingSettings = require('../models/BrandingSettings');

// Get current branding settings
const getBranding = async (req, res) => {
  try {
    const b = await BrandingSettings.findOne().sort({ updatedAt: -1 }).lean();

    if (!b) {
      return res.json({
        mainLogo: '',
        footerLogo: '',
        mobileLogo: '',
        favicon: '',
        darkLogo: '',
        lightLogo: '',
        emailLogo: ''
      });
    }

    return res.json({
      mainLogo: b.mainLogo || '',
      footerLogo: b.footerLogo || '',
      mobileLogo: b.mobileLogo || '',
      favicon: b.favicon || '',
      darkLogo: b.darkLogo || '',
      lightLogo: b.lightLogo || '',
      emailLogo: b.emailLogo || ''
    });
  } catch (err) {
    console.error('GET /api/branding error', err);
    res.status(500).json({ error: 'Server Error' });
  }
};

// Update branding (admin)
const updateBranding = async (req, res) => {
  try {
    const files = req.files || {};
    const body = req.body || {};

    const makeUrl = (file) => file ? (`/uploads/${file.filename}`) : null;

    const payload = {
      mainLogo: makeUrl((files.mainLogo || [])[0]) || body.mainLogo || '',
      footerLogo: makeUrl((files.footerLogo || [])[0]) || body.footerLogo || '',
      mobileLogo: makeUrl((files.mobileLogo || [])[0]) || body.mobileLogo || '',
      favicon: makeUrl((files.favicon || [])[0]) || body.favicon || '',
      darkLogo: makeUrl((files.darkLogo || [])[0]) || body.darkLogo || '',
      lightLogo: makeUrl((files.lightLogo || [])[0]) || body.lightLogo || '',
      emailLogo: makeUrl((files.emailLogo || [])[0]) || body.emailLogo || ''
    };

    // Upsert single branding document
    const updated = await BrandingSettings.findOneAndUpdate({}, payload, { upsert: true, new: true, setDefaultsOnInsert: true });
    return res.json({ message: 'Branding updated', branding: updated });
  } catch (err) {
    console.error('POST /api/admin/branding error', err);
    res.status(500).json({ error: 'Failed to update branding' });
  }
};

module.exports = {
  getBranding,
  updateBranding
};
