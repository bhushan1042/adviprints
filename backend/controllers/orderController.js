const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Order = require('../models/Order');

// Helper function to save base64 image
const saveBase64Image = (base64Data, filename, dir) => {
  return new Promise((resolve, reject) => {
    try {
      if (!base64Data) {
        resolve(null);
        return;
      }

      const base64String = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;
      const buffer = Buffer.from(base64String, 'base64');
      const filepath = path.join(dir, filename);
      fs.writeFileSync(filepath, buffer);
      const url = `/uploads/${path.basename(dir)}/${filename}`;
      console.log(`   ✅ Saved ${filename} (${(buffer.length / 1024).toFixed(2)}KB) -> ${url}`);
      resolve(url);
    } catch (err) {
      console.error(`   ❌ Error saving ${filename}:`, err.message);
      reject(err);
    }
  });
};

// Create order
const createOrder = async (req, res) => {
  try {
    console.log('\n' + '='.repeat(60));
    console.log('📦 NEW ORDER RECEIVED');
    console.log('='.repeat(60));
    console.log('Time:', new Date().toISOString());
    console.log('Request Body Keys:', Object.keys(req.body));

    const {
      customerName,
      customerEmail,
      customerPhone,
      address,
      productId,
      productName,
      productPrice,
      productCode,
      designTemplate,
      originalImage,
      previewImage,
      uploadedImage,
      position,
      quantity,
      totalPrice,
      paymentMethod
    } = req.body;

    console.log('📋 Validating order data...');

    const errors = [];
    if (!customerName) errors.push('❌ customerName is missing');
    if (!customerEmail) errors.push('❌ customerEmail is missing');
    if (!customerPhone) errors.push('❌ customerPhone is missing');
    if (!address) errors.push('❌ address is missing');
    if (!designTemplate) errors.push('❌ designTemplate is missing');
    if (!originalImage) errors.push('❌ originalImage is missing');

    if (errors.length > 0) {
      console.log('❌ VALIDATION FAILED:');
      errors.forEach(e => console.log('   ' + e));
      return res.status(400).json({
        error: 'Missing required fields',
        missingFields: errors
      });
    }

    console.log('✅ Validation passed');

    let parsedAddress = address;
    if (typeof address === 'string') {
      try {
        parsedAddress = JSON.parse(address);
        console.log('   Parsed address from JSON string');
      } catch (e) {
        parsedAddress = { street: address };
        console.log('   Treated as simple street address');
      }
    } else if (typeof address === 'object' && address !== null) {
      parsedAddress = address;
      console.log('   Address received as object');
    }

    console.log('   Final address:', parsedAddress);

    const uploadsDir = path.join(__dirname, '..', 'public', 'uploads');
    const originalDir = path.join(uploadsDir, 'original');
    const previewDir = path.join(uploadsDir, 'preview');
    const uploadedDir = path.join(uploadsDir, 'uploaded');

    console.log('📁 Creating upload directories...');
    [originalDir, previewDir, uploadedDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log('   ✅ Created:', dir);
      } else {
        console.log('   ⚠️ Already exists:', dir);
      }
    });

    console.log('🖼️  Saving design images to disk...');

    const timestamp = Date.now();
    const originalImagePath = await saveBase64Image(originalImage, `original_${timestamp}.png`, originalDir);
    const previewImagePath = await saveBase64Image(previewImage, `preview_${timestamp}.png`, previewDir);
    const uploadedImagePath = await saveBase64Image(uploadedImage, `uploaded_${timestamp}.png`, uploadedDir);

    console.log('✅ All images saved successfully');

    console.log('💾 Creating order in MongoDB...');

    if (mongoose.connection.readyState !== 1) {
      console.error('❌ MongoDB is not connected!');
      return res.status(500).json({
        error: 'Database connection failed',
        details: 'MongoDB is not connected. Orders cannot be saved.'
      });
    }

    const orderData = {
      customerName,
      customerEmail,
      customerPhone,
      address: parsedAddress,
      productId: productId || null,
      productName: productName || 'Custom T-Shirt',
      productPrice: productPrice || 19.99,
      productCode: productCode || null,
      designTemplate,
      originalImagePath,
      previewImagePath,
      uploadedImageData: uploadedImagePath,
      position: position || {},
      quantity: quantity || 1,
      totalPrice: totalPrice || productPrice || 19.99,
      status: 'pending',
      paymentMethod: paymentMethod || 'cod'
    };

    console.log('📝 Order data to save:', {
      customer: customerName,
      email: customerEmail,
      template: designTemplate,
      product: productName,
      status: 'pending'
    });

    const order = await Order.create(orderData);

    console.log('✅ Order saved successfully!');
    console.log('   Order ID:', order._id);
    console.log('   Created At:', order.createdAt);
    console.log('='.repeat(60) + '\n');

    res.status(201).json({
      success: true,
      orderId: order._id,
      message: 'Order created successfully',
      order
    });
  } catch (err) {
    console.error('\n' + '❌ ERROR CREATING ORDER:');
    console.error('   Error Type:', err.constructor.name);
    console.error('   Message:', err.message);
    console.error('   Stack:', err.stack);
    console.error('='.repeat(60) + '\n');

    res.status(500).json({
      error: 'Failed to create order',
      details: err.message,
      type: err.constructor.name
    });
  }
};

// Get all orders (public)
const getAllOrdersPublic = async (req, res) => {
  console.log('📋 PUBLIC: Fetching all orders (no auth required)');
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        error: 'Database not connected',
        mongodb: 'disconnected'
      });
    }

    const orders = await Order.find().sort({ createdAt: -1 }).limit(100);
    console.log(`✅ Found ${orders.length} orders`);

    res.json({
      success: true,
      count: orders.length,
      orders: orders
    });
  } catch (err) {
    console.error('❌ Error fetching orders:', err.message);
    res.status(500).json({
      error: 'Failed to fetch orders',
      details: err.message
    });
  }
};

// Get all orders (admin)
const getAllOrders = async (req, res) => {
  console.log('📋 ADMIN: Fetching all orders');
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        error: 'Database not connected'
      });
    }

    const orders = await Order.find().sort({ createdAt: -1 }).limit(100);
    console.log(`✅ Found ${orders.length} orders`);
    res.json(orders);
  } catch (err) {
    console.error('❌ Error fetching orders:', err.message);
    res.status(500).json({
      error: 'Failed to fetch orders',
      details: err.message
    });
  }
};

// Get single order
const getOrder = async (req, res) => {
  console.log(`🔍 Fetching order: ${req.params.id}`);
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        error: 'Database not connected'
      });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      console.log(`❌ Order not found: ${req.params.id}`);
      return res.status(404).json({ error: 'Order not found' });
    }

    console.log(`✅ Order found: ${order._id}`);
    res.json(order);
  } catch (err) {
    console.error('❌ Error fetching order:', err.message);
    res.status(500).json({
      error: 'Failed to fetch order',
      details: err.message
    });
  }
};

// Update order status
const updateOrderStatus = async (req, res) => {
  const { status } = req.body;
  console.log(`📝 Updating order: ${req.params.id} -> Status: ${status}`);

  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        error: 'Database not connected'
      });
    }

    if (!['pending', 'processing', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({
        error: 'Invalid status',
        validStatuses: ['pending', 'processing', 'completed', 'cancelled']
      });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status, updatedAt: new Date() },
      { new: true }
    );

    if (!order) {
      console.log(`❌ Order not found: ${req.params.id}`);
      return res.status(404).json({ error: 'Order not found' });
    }

    console.log(`✅ Order updated: ${order._id} -> ${status}`);
    res.json(order);
  } catch (err) {
    console.error('❌ Error updating order:', err.message);
    res.status(500).json({
      error: 'Failed to update order',
      details: err.message
    });
  }
};

// Download order image
const downloadOrderImage = async (req, res) => {
  try {
    const { id, imagePath } = req.params;
    console.log(`📥 Download request - Order: ${id}, Path: ${imagePath}`);

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: 'Database not connected' });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    let filePathToDownload;
    if (imagePath.includes('original')) {
      filePathToDownload = order.originalImagePath;
    } else if (imagePath.includes('preview')) {
      filePathToDownload = order.previewImagePath;
    } else if (imagePath.includes('uploaded')) {
      filePathToDownload = order.uploadedImageData;
    } else {
      return res.status(400).json({ error: 'Invalid image type' });
    }

    if (!filePathToDownload) {
      return res.status(404).json({ error: 'Image not found in order' });
    }

    const relPath = String(filePathToDownload).replace(/^\/+/, '');
    const fullPath = path.join(__dirname, '..', 'public', relPath);

    if (!fs.existsSync(fullPath)) {
      console.error(`❌ File not found: ${fullPath}`);
      return res.status(404).json({ error: 'File not found on server' });
    }

    const filename = filePathToDownload.split('/').pop();
    const ext = path.extname(filename).toLowerCase();

    let contentType = 'application/octet-stream';
    if (ext === '.png') contentType = 'image/png';
    else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
    else if (ext === '.webp') contentType = 'image/webp';
    else if (ext === '.gif') contentType = 'image/gif';

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', contentType);

    const fileStream = fs.createReadStream(fullPath);
    fileStream.pipe(res);

    fileStream.on('error', (err) => {
      console.error('❌ Error streaming file:', err.message);
      res.status(500).json({ error: 'Failed to download file' });
    });

    console.log(`✅ File download started: ${filename}`);
  } catch (err) {
    console.error('❌ Error in download endpoint:', err.message);
    res.status(500).json({ error: 'Failed to download file', details: err.message });
  }
};

// Delete order
const deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🗑️  Delete request - Order: ${id}`);

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: 'Database not connected' });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const filesToDelete = [
      order.originalImagePath,
      order.previewImagePath,
      order.uploadedImageData
    ].filter(p => p);

    console.log(`📁 Deleting ${filesToDelete.length} associated files...`);

    for (const imagePath of filesToDelete) {
      if (imagePath) {
        const relDeletePath = String(imagePath).replace(/^\/+/, '');
        const fullPath = path.join(__dirname, '..', 'public', relDeletePath);
        try {
          if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
            console.log(`   ✅ Deleted: ${fullPath}`);
          } else {
            console.log(`   ⚠️  File not found: ${fullPath}`);
          }
        } catch (fileErr) {
          console.error(`   ❌ Error deleting file ${fullPath}:`, fileErr.message);
        }
      }
    }

    const deletedOrder = await Order.findByIdAndDelete(id);
    console.log(`✅ Order deleted: ${id}`);

    res.json({
      success: true,
      message: 'Order and associated files deleted successfully',
      deletedOrderId: id,
      filesDeleted: filesToDelete.length
    });
  } catch (err) {
    console.error('❌ Error deleting order:', err.message);
    res.status(500).json({
      error: 'Failed to delete order',
      details: err.message
    });
  }
};

module.exports = {
  createOrder,
  getAllOrdersPublic,
  getAllOrders,
  getOrder,
  updateOrderStatus,
  downloadOrderImage,
  deleteOrder
};
