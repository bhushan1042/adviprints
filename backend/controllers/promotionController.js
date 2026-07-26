const Promotion = require('../models/Promotion');

// Get active promotions
const getPromotions = async (req, res) => {
  try {
    const now = new Date();
    const promos = await Promotion.find({ active: true }).sort({ order: 1 }).lean();

    // filter by date if set
    const out = promos.filter(p => {
      if (p.startsAt && p.startsAt > now) return false;
      if (p.endsAt && p.endsAt < now) return false;
      return true;
    });

    res.json(out);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server Error' });
  }
};

module.exports = {
  getPromotions
};
