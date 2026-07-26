const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authenticate');
const {
  createOrder,
  getAllOrdersPublic,
  getAllOrders,
  getOrder,
  updateOrderStatus,
  downloadOrderImage,
  deleteOrder
} = require('../controllers/orderController');

// Public routes
router.post('/', createOrder);
router.get('/public/all', getAllOrdersPublic);
router.get('/:id', getOrder);

// Protected routes
router.get('/', authenticate, getAllOrders);
router.put('/:id', authenticate, updateOrderStatus);
router.get('/:id/download/:imagePath(*)', authenticate, downloadOrderImage);
router.delete('/:id', authenticate, deleteOrder);

module.exports = router;
