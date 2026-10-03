const Order = require('../models/Order');
const storage = require('../services/storage');
const { decodeBase64Image } = require('../utils/imageType');
const { MAX_IMAGE_BYTES } = require('../config/multer');
const { toPublicOrder } = require('../utils/orderView');

const STATUSES = ['pending', 'processing', 'completed', 'cancelled'];
const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

// Maps the artwork "kind" used in URLs to the Order field holding its storage reference.
const ARTWORK_FIELDS = {
  original: 'originalImagePath',
  preview: 'previewImagePath',
  uploaded: 'uploadedImageData'
};

const text = (value, max) => (typeof value === 'string' ? value.trim().slice(0, max) : '');
const positiveNumber = (value, fallback) => {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
};

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

// Create order (public). Artwork is stored privately; it is never exposed through a public URL.
const createOrder = async (req, res, next) => {
  const savedRefs = [];
  try {
    const body = req.body || {};
    const customerName = text(body.customerName, 120);
    const customerEmail = text(body.customerEmail, 200);
    const customerPhone = text(body.customerPhone, 30);
    const designTemplate = text(body.designTemplate, 50);
    const address = parseAddress(body.address);

    const missing = [];
    if (!customerName) missing.push('customerName');
    if (!customerEmail) missing.push('customerEmail');
    if (!customerPhone) missing.push('customerPhone');
    if (!address) missing.push('address');
    if (!designTemplate) missing.push('designTemplate');
    if (!body.originalImage) missing.push('originalImage');
    if (missing.length) {
      return res.status(400).json({ error: 'Missing required fields', missingFields: missing });
    }
    if (!EMAIL_PATTERN.test(customerEmail)) throw badRequest('Invalid email address');

    const images = {};
    for (const [field, folder] of [
      ['originalImage', 'orders/original'],
      ['previewImage', 'orders/preview'],
      ['uploadedImage', 'orders/uploaded']
    ]) {
      const buffer = decodeBase64Image(body[field], MAX_IMAGE_BYTES);
      if (!buffer) continue;
      const saved = await storage.saveImage(buffer, { folder, visibility: 'private' });
      savedRefs.push(saved.ref);
      images[field] = saved.ref;
    }

    const quantity = Math.min(Math.max(Math.floor(positiveNumber(body.quantity, 1)) || 1, 1), 1000);
    const productPrice = positiveNumber(body.productPrice, 19.99);
    const totalPrice = positiveNumber(body.totalPrice, productPrice);

    const order = await Order.create({
      customerName,
      customerEmail,
      customerPhone,
      address,
      productId: body.productId || null,
      productName: text(body.productName, 200) || 'Custom T-Shirt',
      productPrice,
      productCode: text(body.productCode, 50) || null,
      designTemplate,
      originalImagePath: images.originalImage,
      previewImagePath: images.previewImage,
      uploadedImageData: images.uploadedImage,
      position: body.position && typeof body.position === 'object' ? body.position : {},
      quantity,
      totalPrice,
      status: 'pending',
      paymentMethod: ['card', 'upi', 'cod'].includes(body.paymentMethod) ? body.paymentMethod : 'cod'
    });

    console.info(`[orders] Created order ${order._id}`);
    res.status(201).json({
      success: true,
      orderId: order._id,
      message: 'Order created successfully',
      order: toPublicOrder(order)
    });
  } catch (err) {
    // Do not leave orphaned private files behind when the order could not be saved.
    await Promise.all(savedRefs.map((ref) => storage.deleteRef(ref)));
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

// Get single order. Administrators see the full record; everyone else gets a sanitised view.
const getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    if (req.user && req.user.role === 'admin') return res.json(order);
    return res.json(toPublicOrder(order));
  } catch (err) {
    console.error('[orders] get failed:', err.message);
    res.status(500).json({ error: 'Failed to fetch order' });
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
    const field = ARTWORK_FIELDS[req.params.kind];
    if (!field) return res.status(400).json({ error: 'Invalid image type' });

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (!order[field]) return res.status(404).json({ error: 'Image not found in order' });

    const file = await storage.readPrivate(order[field]);
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

    const refs = [order.originalImagePath, order.previewImagePath, order.uploadedImageData].filter(Boolean);
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
  updateOrderStatus,
  getOrderArtwork,
  deleteOrder
};
