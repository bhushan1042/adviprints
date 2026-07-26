const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authenticate');
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
router.post('/', authenticate, createCategory);
router.put('/:id', authenticate, updateCategory);
router.delete('/:id', authenticate, deleteCategory);

module.exports = router;
