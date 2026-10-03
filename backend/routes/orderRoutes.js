const express = require('express');
const router = express.Router();
const { requireAdmin, optionalAuth } = require('../middleware/authenticate');
const { validateObjectId } = require('../middleware/validateObjectId');
const { orderLimiter } = require('../middleware/rateLimiters');
const {
  createOrder,
  getAllOrders,
  getAllOrdersAdmin,
  getOrder,
  updateOrderStatus,
  getOrderArtwork,
  deleteOrder
} = require('../controllers/orderController');

// Public: customers place orders and view their own order confirmation by id.
// A fixed-size JSON body is parsed here because the artwork arrives as base64.
router.post('/', orderLimiter, express.json({ limit: '30mb' }), createOrder);

// Admin
router.get('/', requireAdmin, getAllOrders);
router.get('/public/all', requireAdmin, getAllOrdersAdmin); // legacy path; no longer public
router.get('/:id/artwork/:kind', requireAdmin, validateObjectId(), getOrderArtwork);
router.get('/:id/download/:kind', requireAdmin, validateObjectId(), getOrderArtwork);

// Public view is sanitised; administrators with a valid token get the full record.
router.get('/:id', optionalAuth, validateObjectId(), getOrder);

router.put('/:id', requireAdmin, validateObjectId(), updateOrderStatus);
router.delete('/:id', requireAdmin, validateObjectId(), deleteOrder);

module.exports = router;
