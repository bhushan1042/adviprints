const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authenticate');
const {
  getStats,
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser
} = require('../controllers/adminController');

// All routes are protected
router.get('/stats', authenticate, getStats);
router.get('/users', authenticate, getUsers);
router.get('/users/:id', authenticate, getUser);
router.post('/users', authenticate, createUser);
router.put('/users/:id', authenticate, updateUser);
router.delete('/users/:id', authenticate, deleteUser);

module.exports = router;
