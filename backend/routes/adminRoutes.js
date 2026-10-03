const express = require('express');
const mongoose = require('mongoose');
const { requireAdmin } = require('../middleware/authenticate');
const { validateObjectId } = require('../middleware/validateObjectId');
const { updateHomepage } = require('../controllers/homepageController');
const {
  getStats,
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser
} = require('../controllers/adminController');

// User management. Mounted at /admin/users and, for the built-in admin panel, at /users.
// Routes are protected one by one so that the /admin HTML pages still fall through to the panel.
const usersRouter = express.Router();
usersRouter.get('/', requireAdmin, getUsers);
// Non-id paths such as /admin/users/add belong to the admin panel pages, so let them fall through.
usersRouter.get('/:id', (req, res, next) => (mongoose.isValidObjectId(req.params.id) ? next() : next('route')), requireAdmin, getUser);
usersRouter.post('/', requireAdmin, createUser);
usersRouter.put('/:id', requireAdmin, validateObjectId(), updateUser);
usersRouter.delete('/:id', requireAdmin, validateObjectId(), deleteUser);

const adminRouter = express.Router();
adminRouter.get('/stats', requireAdmin, getStats);
adminRouter.post('/homepage', requireAdmin, updateHomepage);
adminRouter.use('/users', usersRouter);

module.exports = { adminRouter, usersRouter };
