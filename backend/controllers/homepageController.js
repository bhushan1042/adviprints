const Homepage = require('../models/Homepage');

// Get homepage settings
const getHomepage = async (req, res) => {
  try {
    let doc = await Homepage.findOne().sort({ createdAt: -1 });

    if (!doc) {
      // initialize default
      doc = await Homepage.create({ title: '', bannerSlides: [], bannerImages: [] });
    }

    // If legacy bannerImages present but bannerSlides empty, migrate them into slides
    if ((!doc.bannerSlides || doc.bannerSlides.length === 0) && doc.bannerImages && doc.bannerImages.length) {
      doc.bannerSlides = doc.bannerImages.map((url, i) => ({ imageUrl: url, caption: '', ctaText: '', ctaUrl: '', order: i }));
      await doc.save();
    }

    res.json(doc);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server Error' });
  }
};

// Update homepage settings (admin)
const updateHomepage = async (req, res) => {
  try {
    const { title, bannerSlides, bannerImages } = req.body || {};

    let doc = await Homepage.findOne().sort({ createdAt: -1 });

    const slides = Array.isArray(bannerSlides) ? bannerSlides.map((s, i) => ({
      imageUrl: s.imageUrl || s.url || s.imageUrl,
      caption: s.caption || '',
      ctaText: s.ctaText || '',
      ctaUrl: s.ctaUrl || '',
      order: typeof s.order === 'number' ? s.order : i
    })) : (Array.isArray(bannerImages) ? bannerImages.map((url, i) => ({ imageUrl: url, caption: '', ctaText: '', ctaUrl: '', order: i })) : []);

    if (!doc) {
      doc = await Homepage.create({ title: title || '', bannerSlides: slides, bannerImages: Array.isArray(bannerImages) ? bannerImages : [] });
    } else {
      doc.title = title || '';
      doc.bannerSlides = slides;
      doc.bannerImages = Array.isArray(bannerImages) ? bannerImages : doc.bannerImages || [];
      await doc.save();
    }

    res.json(doc);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server Error' });
  }
};

module.exports = {
  getHomepage,
  updateHomepage
};
