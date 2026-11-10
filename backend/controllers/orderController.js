const Order = require('../models/Order');
const Product = require('../models/Product');
const storage = require('../services/storage');
const { toPublicOrder } = require('../utils/orderView');
const { colourName, findVariant } = require('../utils/productVariants');
const { submitOrder, syncOrderStatus } = require('../services/qikinkOrderService');
const mongoose = require('mongoose');

const STATUSES = ['pending', 'processing', 'completed', 'cancelled'];
const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

// Maps the artwork "kind" used in URLs to the Order field holding its storage reference.
const ARTWORK_FIELDS = {
  original: 'originalImagePath',
  preview: 'previewImagePath',
  uploaded: 'uploadedImageData'
};

const text = (value, max) => (typeof value === 'string' ? value.trim().slice(0, max) : '');
const isValidIndianPinCode = (value) => typeof value === 'string' && /^\d{6}$/.test(value);

const parseAddress = (address) => {
  let value = address;
  if (typeof value === 'string') {
    try {
      value = JSON.parse(value);
    } catch (e) {
      return { street: text(address, 300) };
    }
  }
  if (!value || typeof value !== 'object') return null;
  return {
    street: text(value.street, 300),
    city: text(value.city, 100),
    state: text(value.state, 100),
    zipCode: text(value.zipCode || value.zip, 20),
    country: text(value.country, 100)
  };
};

const badRequest = (message) => Object.assign(new Error(message), { status: 400 });

// Create ready-designed product order. Product pricing and SKU mappings are resolved server-side.
const createOrder = async (req, res, next) => {
  let checkoutId = '';
  try {
    const body = req.body || {};
    const customerName = text(body.customerName, 120);
    const customerEmail = text(body.customerEmail, 200);
    const customerPhone = text(body.customerPhone, 30);
    const address = parseAddress(body.address);
    checkoutId = typeof body.checkoutId === 'string' ? body.checkoutId.trim() : '';
    if (!customerName || !customerEmail || !customerPhone || !address || !checkoutId) {
      return res.status(400).json({ error: 'Customer details, address, and checkoutId are required.' });
    }
    if (!EMAIL_PATTERN.test(customerEmail)) throw badRequest('Invalid email address');
    if (!/^[a-zA-Z0-9_-]{8,100}$/.test(checkoutId)) throw badRequest('Invalid checkoutId');
    if (!address.street || !address.city || !address.state || !address.zipCode) {
      throw badRequest('Street address, city, state, and postal code are required.');
    }
    if (!isValidIndianPinCode(address.zipCode)) {
      throw badRequest('PIN code must contain exactly six digits.');
    }
    if (address.street.length > 90) throw badRequest('Street address must not exceed 90 characters.');
    const existing = await Order.findOne({ checkoutId });
    if (existing) {
      return res.status(200).json({
        success: true,
        orderId: existing._id,
        message: 'This checkout was already submitted.',
        order: toPublicOrder(existing)
      });
    }
    if (body.paymentMethod !== 'cod') {
      throw badRequest('Only Cash on Delivery is currently available. Online payment must be confirmed before Qikink Prepaid orders can be submitted.');
    }
    if (!Array.isArray(body.items) || body.items.length === 0 || body.items.length > 20) {
      throw badRequest('Order must contain between 1 and 20 items.');
    }

    const requestedItems = body.items.map((item) => {
      if (!item || !mongoose.isValidObjectId(item.productId)) throw badRequest('Invalid product selection.');
      const quantity = Number(item.quantity);
      if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100) {
        throw badRequest('Each item quantity must be an integer from 1 to 100.');
      }
      return {
        productId: String(item.productId),
        size: text(item.size, 30),
        colour: text(item.colour, 50),
        quantity
      };
    });

    const productIds = [...new Set(requestedItems.map((item) => item.productId))];
    const products = await Product.find({ _id: { $in: productIds }, status: 'ENABLED' }).lean();
    const productsById = new Map(products.map((product) => [String(product._id), product]));
    const lineItems = requestedItems.map((requested) => {
      const product = productsById.get(requested.productId);
      if (!product) throw badRequest('A selected product is no longer available.');
      const variant = findVariant(product, requested.size, requested.colour);
      if (!variant) throw badRequest('The selected size and colour do not have a verified Qikink SKU.');
      const price = Number(product.price);
      if (!Number.isFinite(price) || price <= 0) throw badRequest('A selected product has an invalid server price.');
      if (!(Number(variant.qikinkPrice) > 0)) throw badRequest('The selected product is missing its Qikink price. Contact the store.');
      return {
        productId: product._id,
        productName: product.name,
        productPrice: price,
        productCode: product.productCode,
        productImageUrl: product.imageUrl,
        size: variant.size,
        colour: colourName(variant.colour),
        qikinkSku: variant.sku,
        qikinkPrintTypeId: variant.printTypeId,
        qikinkPrice: Number(variant.qikinkPrice),
        quantity: requested.quantity,
        totalPrice: Math.round(price * requested.quantity * 100) / 100
      };
    });
    const totalPrice = Math.round(lineItems.reduce((sum, item) => sum + item.totalPrice, 0) * 100) / 100;
    const firstItem = lineItems[0];
    const order = await Order.create({
      checkoutId,
      customerName,
      customerEmail,
      customerPhone,
      address,
      productId: firstItem.productId,
      productName: firstItem.productName,
      productPrice: firstItem.productPrice,
      productCode: firstItem.productCode,
      productImageUrl: firstItem.productImageUrl,
      size: firstItem.size,
      colour: firstItem.colour,
      qikinkSku: firstItem.qikinkSku,
      qikinkPrintTypeId: firstItem.qikinkPrintTypeId,
      lineItems,
      quantity: lineItems.reduce((sum, item) => sum + item.quantity, 0),
      totalPrice,
      status: 'pending',
      paymentMethod: 'cod',
      qikinkFulfillment: { state: 'ready' }
    });

    const submittedOrder = await submitOrder(order);
    console.info(`[orders] Created order ${order._id}; Qikink state: ${submittedOrder.qikinkFulfillment.state}`);
    res.status(201).json({
      success: true,
      orderId: submittedOrder._id,
      message: submittedOrder.qikinkFulfillment.state === 'submitted'
        ? 'Order created and submitted to Qikink Sandbox.'
        : 'Order created. Qikink fulfilment requires attention.',
      order: toPublicOrder(submittedOrder)
    });
  } catch (err) {
    if (err && err.code === 11000 && checkoutId) {
      const existing = await Order.findOne({ checkoutId });
      if (existing) {
        return res.status(200).json({
          success: true,
          orderId: existing._id,
          message: 'This checkout was already submitted.',
          order: toPublicOrder(existing)
        });
      }
    }
    next(err);
  }
};

// Get all orders (admin)
const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 }).limit(100);
    res.json(orders);
  } catch (err) {
    console.error('[orders] list failed:', err.message);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
};

// Legacy response shape of the former public listing. Now admin-only.
const getAllOrdersAdmin = async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 }).limit(100);
    res.json({ success: true, count: orders.length, orders });
  } catch (err) {
    console.error('[orders] list failed:', err.message);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
};

// Guests must prove possession of their checkout capability; the order ID alone is not authorization.
const getOrder = async (req, res) => {
  try {
    const isAdmin = req.user && req.user.role === 'admin';
    const checkoutId = req.headers['x-checkout-id'];
    if (!isAdmin && (typeof checkoutId !== 'string' || !/^[a-zA-Z0-9_-]{8,100}$/.test(checkoutId))) {
      return res.status(404).json({ error: 'Order not found' });
    }
    const order = isAdmin
      ? await Order.findById(req.params.id)
      : await Order.findOne({ _id: req.params.id, checkoutId });
    if (!order) return res.status(404).json({ error: 'Order not found' });

    if (isAdmin) return res.json(order);
    return res.json(toPublicOrder(order));
  } catch (err) {
    console.error('[orders] get failed:', err.message);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
};

const syncQikinkStatus = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    const synced = await syncOrderStatus(order);
    res.json(synced);
  } catch (error) {
    const message = error && error.code === 'SANDBOX_LIST_UNAVAILABLE'
      ? 'Qikink status lookup is unavailable in Sandbox.'
      : error && error.code === 'LIVE_DISABLED'
        ? 'Live Qikink API access is disabled.'
        : 'Unable to synchronize Qikink status.';
    console.error('[orders] Qikink status sync failed:', error && error.code ? error.code : 'UNKNOWN');
    res.status(503).json({ error: message });
  }
};

// Update order status (admin)
const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body || {};
    if (!STATUSES.includes(status)) {
      return res.status(400).json({ error: 'Invalid status', validStatuses: STATUSES });
    }

    const order = await Order.findByIdAndUpdate(req.params.id, { status, updatedAt: new Date() }, { new: true });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  } catch (err) {
    console.error('[orders] update failed:', err.message);
    res.status(500).json({ error: 'Failed to update order' });
  }
};

// Stream private customer artwork to an administrator.
const getOrderArtwork = async (req, res) => {
  try {
    const { kind } = req.params;
    const field = ARTWORK_FIELDS[kind];
    const exportMatch = /^artwork-(\d+)$/.exec(kind);
    if (!field && !exportMatch) return res.status(400).json({ error: 'Invalid image type' });

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    const exportIndex = exportMatch ? Number(exportMatch[1]) : -1;
    const artworkRef = exportMatch ? order.artworkExports?.[exportIndex]?.imagePath : order[field];
    if (!artworkRef) return res.status(404).json({ error: 'Image not found in order' });

    const file = await storage.readPrivate(artworkRef);
    if (!file) return res.status(404).json({ error: 'File not found in storage' });

    const asDownload = req.path.includes('/download/');
    res.setHeader('Content-Type', file.contentType);
    res.setHeader('Content-Disposition', `${asDownload ? 'attachment' : 'inline'}; filename="${file.filename}"`);
    res.setHeader('Cache-Control', 'private, no-store');
    res.send(file.buffer);
  } catch (err) {
    console.error('[orders] artwork failed:', err.message);
    res.status(500).json({ error: 'Failed to load image' });
  }
};

// Delete order and its stored artwork (admin)
const deleteOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const refs = [
      order.originalImagePath,
      order.previewImagePath,
      order.uploadedImageData,
      ...(order.artworkExports || []).map((item) => item.imagePath)
    ].filter(Boolean);
    await Order.findByIdAndDelete(order._id);
    const results = await Promise.all(refs.map((ref) => storage.deleteRef(ref)));

    res.json({
      success: true,
      message: 'Order and associated files deleted successfully',
      deletedOrderId: req.params.id,
      filesDeleted: results.filter(Boolean).length
    });
  } catch (err) {
    console.error('[orders] delete failed:', err.message);
    res.status(500).json({ error: 'Failed to delete order' });
  }
};

module.exports = {
  createOrder,
  getAllOrders,
  getAllOrdersAdmin,
  getOrder,
  syncQikinkStatus,
  updateOrderStatus,
  getOrderArtwork,
  deleteOrder,
  isValidIndianPinCode
};
