const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { JWT_SECRET } = require('../middleware/authenticate');

// Register user
const register = async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body;

    if (!name || !email || !password) {
      return res.status(400).send('Missing fields');
    }

    if (password !== confirmPassword) {
      return res.status(400).send('password does not match');
    }

    const userMatch = await User.findOne({ email });
    if (userMatch) {
      return res.status(400).send('User already match');
    }

    const hashedpass = await bcrypt.hash(password, 10);
    const newuser = {
      name: name,
      email: email,
      password: hashedpass
    };

    const created = await User.create(newuser);
    const token = jwt.sign({ userID: created._id, email: created.email }, JWT_SECRET, { expiresIn: '1h' });
    return res.status(201).json({ message: 'User created successfully', token });
  } catch (err) {
    console.log(err);
    return res.status(500).send('Server error');
  }
};

// Login user
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).send('Missing fields');
    }

    const userMatch = await User.findOne({ email });
    if (!userMatch) {
      return res.status(400).send('User not available');
    }

    const passwordMatch = await bcrypt.compare(password, userMatch.password);
    if (!passwordMatch) {
      return res.status(400).send('In valid credientials');
    }

    const token = jwt.sign(
      { userID: userMatch._id, email: userMatch.email },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    return res.status(200).json({
      message: 'Login successful',
      token
    });
  } catch (err) {
    console.log(err);
    return res.status(500).send('Server error');
  }
};

module.exports = {
  register,
  login
};
