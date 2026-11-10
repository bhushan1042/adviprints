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
  syncQikinkStatus,
  updateOrderStatus,
  getOrderArtwork,
  deleteOrder
} = require('../controllers/orderController');

// Public: customers place orders and view their order confirmation by id.
router.post('/', orderLimiter, express.json({ limit: '1mb' }), createOrder);

// Admin
router.get('/', requireAdmin, getAllOrders);
router.get('/public/all', requireAdmin, getAllOrdersAdmin); // legacy path; no longer public
router.get('/:id/artwork/:kind', requireAdmin, validateObjectId(), getOrderArtwork);
router.get('/:id/download/:kind', requireAdmin, validateObjectId(), getOrderArtwork);
router.get('/:id/qikink-status', requireAdmin, validateObjectId(), syncQikinkStatus);

// Public view is sanitised; administrators with a valid token get the full record.
router.get('/:id', optionalAuth, validateObjectId(), getOrder);

router.put('/:id', requireAdmin, validateObjectId(), updateOrderStatus);
router.delete('/:id', requireAdmin, validateObjectId(), deleteOrder);

module.exports = router;
