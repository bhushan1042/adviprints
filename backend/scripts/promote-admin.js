// Grants the admin role to an existing user.
//   npm run promote-admin -- someone@example.com
const mongoose = require('mongoose');
const { getConfig } = require('../config/env');
const { connectDatabase, disconnectDatabase, isDatabaseError, formatDatabaseError } = require('../config/db');
const User = require('../models/User');

const run = async () => {
  const email = (process.argv[2] || '').trim();
  if (!email) throw new Error('Usage: npm run promote-admin -- <email>');

  await connectDatabase(getConfig());
  const result = await User.updateOne({ email }, { $set: { role: 'admin' } });
  if (result.matchedCount === 0) throw new Error(`No user found with email ${email}`);
  console.log(`${email} is now an admin. They must log in again to receive an admin token.`);
  await disconnectDatabase();
};

run().catch(async (err) => {
  console.error(isDatabaseError(err) ? formatDatabaseError(err) : err.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
