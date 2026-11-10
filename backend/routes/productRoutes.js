const express = require('express');
const router = express.Router();
const { requireAdmin } = require('../middleware/authenticate');
const { validateObjectId } = require('../middleware/validateObjectId');
const {
  listProducts,
  getFeaturedProducts,
  getBestSellers,
  getNewArrivals,
  getProduct,
  listAllProductsAdmin,
  setProductStatus,
  createProduct,
  updateProduct,
  deleteProduct
} = require('../controllers/productController');

// Admin (declared before /:id so "admin" is never treated as an id)
router.get('/admin/all', requireAdmin, listAllProductsAdmin);

// Public routes (ENABLED products only)
router.get('/', listProducts);
router.get('/featured', getFeaturedProducts);
router.get('/best-sellers', getBestSellers);
router.get('/new-arrivals', getNewArrivals);
router.get('/:id', validateObjectId(), getProduct);

// Protected routes
router.post('/', requireAdmin, createProduct);
router.put('/:id', requireAdmin, validateObjectId(), updateProduct);
router.patch('/:id/status', requireAdmin, validateObjectId(), setProductStatus);
router.delete('/:id', requireAdmin, validateObjectId(), deleteProduct);

module.exports = router;
