const jwt = require('jsonwebtoken');
const { getConfig } = require('../config/env');

const isAdminAccount = (user) => {
  const email = String(user.email || '').toLowerCase();
  return user.role === 'admin' || getConfig().adminEmails.includes(email);
};

const signToken = (user) => {
  const config = getConfig();
  const role = isAdminAccount(user) ? 'admin' : 'user';
  const token = jwt.sign({ userID: String(user._id), email: user.email, role }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn
  });
  return { token, role };
};

const verifyToken = (token) => jwt.verify(token, getConfig().jwtSecret);

module.exports = { signToken, verifyToken, isAdminAccount };
