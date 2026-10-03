const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Category = require('../models/Category');
const Product = require('../models/Product');

const MIN_PASSWORD_LENGTH = 8;
const ROLES = ['user', 'admin'];
const asString = (value) => (typeof value === 'string' ? value.trim() : '');

// Get admin stats
const getStats = async (req, res) => {
  try {
    const [categories, products, users] = await Promise.all([
      Category.countDocuments(),
      Product.countDocuments(),
      User.countDocuments()
    ]);
    res.json({ categories, products, users });
  } catch (err) {
    console.error('[admin] stats failed:', err.message);
    res.status(500).json({ error: 'Server Error' });
  }
};

// Get all users
const getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    console.error('[admin] list users failed:', err.message);
    res.status(500).json({ error: 'Server Error' });
  }
};

// Get single user
const getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error('[admin] get user failed:', err.message);
    res.status(500).json({ error: 'Server Error' });
  }
};

// Create user
const createUser = async (req, res) => {
  try {
    const name = asString(req.body.name);
    const email = asString(req.body.email);
    const { password } = req.body;
    const role = ROLES.includes(req.body.role) ? req.body.role : 'user';

    if (!name || !email || typeof password !== 'string' || !password) {
      return res.status(400).json({ error: 'Name, email and password are required' });
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      return res.status(400).json({ error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` });
    }

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ error: 'User already exists' });

    const hashed = await bcrypt.hash(password, 10);
    const created = await User.create({ name, email, password: hashed, role });
    const out = created.toObject();
    delete out.password;
    res.status(201).json(out);
  } catch (err) {
    console.error('[admin] create user failed:', err.message);
    res.status(500).json({ error: 'Server Error' });
  }
};

// Update user
const updateUser = async (req, res) => {
  try {
    const updates = {};
    if (typeof req.body.name === 'string') updates.name = req.body.name.trim();
    if (typeof req.body.email === 'string') updates.email = req.body.email.trim();
    if (ROLES.includes(req.body.role)) {
      if (req.body.role !== 'admin' && req.params.id === req.user.userID) {
        return res.status(400).json({ error: 'You cannot remove your own admin role' });
      }
      updates.role = req.body.role;
    }
    if (req.body.password !== undefined) {
      if (typeof req.body.password !== 'string' || req.body.password.length < MIN_PASSWORD_LENGTH) {
        return res.status(400).json({ error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` });
      }
      updates.password = await bcrypt.hash(req.body.password, 10);
    }

    const updated = await User.findByIdAndUpdate(req.params.id, updates, { new: true }).select('-password');
    if (!updated) return res.status(404).json({ error: 'User not found' });
    res.json(updated);
  } catch (err) {
    console.error('[admin] update user failed:', err.message);
    res.status(500).json({ error: 'Server Error' });
  }
};

// Delete user
const deleteUser = async (req, res) => {
  try {
    if (req.params.id === req.user.userID) {
      return res.status(400).json({ error: 'You cannot delete your own account' });
    }
    const removed = await User.findByIdAndDelete(req.params.id);
    if (!removed) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'User deleted' });
  } catch (err) {
    console.error('[admin] delete user failed:', err.message);
    res.status(500).json({ error: 'Server Error' });
  }
};

module.exports = {
  getStats,
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser
};
