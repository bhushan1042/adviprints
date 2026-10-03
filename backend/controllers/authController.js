const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { signToken } = require('../utils/tokens');

const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const MIN_PASSWORD_LENGTH = 8;

const asString = (value) => (typeof value === 'string' ? value.trim() : '');

// Register user. Public registrations never receive admin rights.
const register = async (req, res) => {
  try {
    const name = asString(req.body.name);
    const email = asString(req.body.email);
    const { password, confirmPassword } = req.body;

    if (!name || !email || typeof password !== 'string' || !password) {
      return res.status(400).send('Missing fields');
    }
    if (!EMAIL_PATTERN.test(email)) {
      return res.status(400).send('Invalid email address');
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      return res.status(400).send(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
    }
    if (password !== confirmPassword) {
      return res.status(400).send('password does not match');
    }

    const userMatch = await User.findOne({ email });
    if (userMatch) {
      return res.status(400).send('User already exists');
    }

    const hashedpass = await bcrypt.hash(password, 10);
    const created = await User.create({ name, email, password: hashedpass, role: 'user' });
    const { token, role } = signToken(created);
    return res.status(201).json({ message: 'User created successfully', token, role });
  } catch (err) {
    console.error('[auth] register failed:', err.message);
    return res.status(500).send('Server error');
  }
};

// Login user
const login = async (req, res) => {
  try {
    const email = asString(req.body.email);
    const { password } = req.body;

    if (!email || typeof password !== 'string' || !password) {
      return res.status(400).send('Missing fields');
    }

    const userMatch = await User.findOne({ email });
    const passwordMatch = userMatch ? await bcrypt.compare(password, userMatch.password) : false;
    if (!userMatch || !passwordMatch) {
      return res.status(400).send('Invalid credentials');
    }

    const { token, role } = signToken(userMatch);
    return res.status(200).json({ message: 'Login successful', token, role });
  } catch (err) {
    console.error('[auth] login failed:', err.message);
    return res.status(500).send('Server error');
  }
};

module.exports = {
  register,
  login
};
