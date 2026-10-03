const mongoose = require('mongoose');

// Rejects malformed ids with 400 instead of letting Mongoose throw a CastError (500).
const validateObjectId = (...params) => (req, res, next) => {
  const names = params.length ? params : ['id'];
  for (const name of names) {
    if (!mongoose.isValidObjectId(req.params[name])) {
      return res.status(400).json({ error: 'Invalid identifier' });
    }
  }
  return next();
};

module.exports = { validateObjectId };
