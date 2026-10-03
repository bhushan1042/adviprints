const express = require('express');
const router = express.Router();
const { requireAdmin } = require('../middleware/authenticate');
const { validateObjectId } = require('../middleware/validateObjectId');
const {
  listCategories,
  getCategory,
  getCategoryProducts,
  createCategory,
  updateCategory,
  deleteCategory
} = require('../controllers/categoryController');

// Public routes
router.get('/', listCategories);
router.get('/:id', getCategory);
router.get('/:id/products', getCategoryProducts);

// Protected routes
router.post('/', requireAdmin, createCategory);
router.put('/:id', requireAdmin, validateObjectId(), updateCategory);
router.delete('/:id', requireAdmin, validateObjectId(), deleteCategory);

module.exports = router;
