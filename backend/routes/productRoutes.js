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
  createProduct,
  updateProduct,
  deleteProduct
} = require('../controllers/productController');

// Public routes
router.get('/', listProducts);
router.get('/featured', getFeaturedProducts);
router.get('/best-sellers', getBestSellers);
router.get('/new-arrivals', getNewArrivals);
router.get('/:id', validateObjectId(), getProduct);

// Protected routes
router.post('/', requireAdmin, createProduct);
router.put('/:id', requireAdmin, validateObjectId(), updateProduct);
router.delete('/:id', requireAdmin, validateObjectId(), deleteProduct);

module.exports = router;
