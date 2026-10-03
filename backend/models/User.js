const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: String,
    email: String,
    password: String,
    // Existing documents have no role and are treated as 'user'. Admins are promoted with
    // `npm run promote-admin -- <email>` or listed in the ADMIN_EMAILS environment variable.
    role: { type: String, enum: ['user', 'admin'], default: 'user' }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('User', userSchema);
