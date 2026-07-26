const Subscriber = require('../models/Subscriber');

// Subscribe to newsletter
const subscribe = async (req, res) => {
  try {
    const { email, name } = req.body;

    if (!email || typeof email !== 'string' || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return res.status(400).json({ error: 'Valid email is required' });
    }

    const lower = email.toLowerCase().trim();
    const exists = await Subscriber.findOne({ email: lower });

    if (exists) {
      return res.status(200).json({ message: 'Already subscribed' });
    }

    const created = await Subscriber.create({ email: lower, name: name || '' });
    res.status(201).json({ message: 'Subscribed', subscriber: created });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server Error' });
  }
};

module.exports = {
  subscribe
};
