const express = require('express');
const ejs = require('ejs');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

// ==========================================
// CONFIG & MIDDLEWARE
// ==========================================
const { connectDatabase } = require('./config/database');
const upload = require('./config/multer');
const errorHandler = require('./middleware/errorHandler');
const notFoundHandler = require('./middleware/notFound');

// ==========================================
// ROUTES
// ==========================================
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const homepageRoutes = require('./routes/homepageRoutes');
const orderRoutes = require('./routes/orderRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const promotionRoutes = require('./routes/promotionRoutes');
const subscriberRoutes = require('./routes/subscriberRoutes');
const brandingRoutes = require('./routes/brandingRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

// ==========================================
// MIDDLEWARE SETUP
// ==========================================
app.use(cors());
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.json({ limit: '50mb' }));

// Serve static uploads
const uploadsDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use('/uploads', express.static(uploadsDir));

// ==========================================
// ROUTE REGISTRATION
// ==========================================
app.post('/register', (req, res) => res.render('index'));
app.get('/login', (req, res) => res.render('index'));
app.get('/register', (req, res) => res.render('register'));

// Auth routes
app.use('/', authRoutes);

// API routes
app.use('/products', productRoutes);
app.use('/categories', categoryRoutes);
app.use('/homepage', homepageRoutes);
app.use('/api/orders', orderRoutes);
app.use('/reviews', reviewRoutes);
app.use('/promotions', promotionRoutes);
app.use('/newsletter', subscriberRoutes);
app.use('/api/branding', brandingRoutes);
app.use('/admin', adminRoutes);

// Upload endpoint
app.post('/upload', (req, res, next) => {
  const { authenticate } = require('./middleware/authenticate');
  authenticate(req, res, () => {
    upload.single('image')(req, res, (err) => {
      if (err) {
        return res.status(500).json({ error: 'Upload failed' });
      }
      if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
      const url = '/uploads/' + req.file.filename;
      res.json({ url, filename: req.file.filename, mimetype: req.file.mimetype, size: req.file.size });
    });
  });
});

// Health check
app.get('/api/health', (req, res) => {
  const mongoConnected = mongoose?.connection?.readyState === 1;
  res.json({
    status: 'OK',
    mongodb: mongoConnected ? 'Connected' : 'Disconnected',
    timestamp: new Date().toISOString()
  });
});

// Admin SPA routes
app.get('/admin', (req, res) => res.render('admin'));
app.get('/admin/*', (req, res) => res.render('admin'));

// ==========================================
// ERROR HANDLING
// ==========================================
app.use(notFoundHandler);
app.use(errorHandler);

// ==========================================
// DATABASE & SERVER STARTUP
// ==========================================
const PORT = process.env.PORT || 5000;

(async () => {
  try {
    await connectDatabase();
    app.listen(PORT, () => {
      console.log('✅ Server connected on port ' + PORT);
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err.message);
    process.exit(1);
  }
})();
    // Enhanced validation with detailed logging
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
      console.log('Received fields:', {
        customerName: customerName ? '✅' : '❌',
        customerEmail: customerEmail ? '✅' : '❌',
        customerPhone: customerPhone ? '✅' : '❌',
        address: address ? '✅' : '❌',
        designTemplate: designTemplate ? '✅' : '❌',
        originalImage: originalImage ? '✅ (base64)' : '❌',
        previewImage: previewImage ? '✅' : '⚠️',
        uploadedImage: uploadedImage ? '✅' : '⚠️'
      });
      return res.status(400).json({ 
        error: 'Missing required fields',
        missingFields: errors
      });
    }
    
    console.log('✅ Validation passed');

    console.log('✅ Validation passed');

    // ==========================================
    // PREPARE ADDRESS
    // ==========================================
    console.log('📍 Processing address...');
    let parsedAddress = address;
    
    // Handle address as object or string
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

    // ==========================================
    // CREATE UPLOAD DIRECTORIES
    // ==========================================
    const uploadsDir = path.join(__dirname, 'public', 'uploads');
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

    // ==========================================
    // SAVE BASE64 IMAGES TO DISK
    // ==========================================
    console.log('🖼️  Saving design images to disk...');
    
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

    const timestamp = Date.now();
    const originalImagePath = await saveBase64Image(originalImage, `original_${timestamp}.png`, originalDir);
    const previewImagePath = await saveBase64Image(previewImage, `preview_${timestamp}.png`, previewDir);
    const uploadedImagePath = await saveBase64Image(uploadedImage, `uploaded_${timestamp}.png`, uploadedDir);
    
    console.log('✅ All images saved successfully');

    // ==========================================
    // CREATE ORDER IN DATABASE
    // ==========================================
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
});

// ==========================================
// GET ALL ORDERS (PUBLIC - FOR TESTING)
// ==========================================
app.get('/api/orders/public/all', async (req, res) => {
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
});

// ==========================================
// GET ALL ORDERS (ADMIN - PROTECTED)
// ==========================================
app.get('/api/orders', authenticate, async (req, res) => {
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
});

// ==========================================
// GET SINGLE ORDER (PUBLIC)
// ==========================================
app.get('/api/orders/:id', async (req, res) => {
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
});

// ==========================================
// UPDATE ORDER STATUS (ADMIN - PROTECTED)
// ==========================================
app.put('/api/orders/:id', authenticate, async (req, res) => {
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
});

// ==========================================
// DOWNLOAD ORIGINAL IMAGE (ADMIN - PROTECTED)
// ==========================================
app.get('/api/orders/:id/download/:imagePath(*)', authenticate, async (req, res) => {
  try {
    const { id, imagePath } = req.params;
    console.log(`📥 Download request - Order: ${id}, Path: ${imagePath}`);
    
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: 'Database not connected' });
    }
    
    // Fetch order to verify it exists and get the correct path
    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    // Determine which image path to use based on request
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
    
    // Normalize stored path (remove leading slash) and construct full file path
    const relPath = String(filePathToDownload).replace(/^\/+/, '');
    const fullPath = path.join(__dirname, 'public', relPath);
    
    // Verify file exists
    if (!fs.existsSync(fullPath)) {
      console.error(`❌ File not found: ${fullPath}`);
      return res.status(404).json({ error: 'File not found on server' });
    }
    
    // Determine filename based on image type
    const filename = filePathToDownload.split('/').pop();
    
    // Set proper headers for download and detect mime-type from extension
    const ext = path.extname(filename).toLowerCase();
    let contentType = 'application/octet-stream';
    if (ext === '.png') contentType = 'image/png';
    else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
    else if (ext === '.webp') contentType = 'image/webp';
    else if (ext === '.gif') contentType = 'image/gif';

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', contentType);
    
    // Stream the file
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
});

// ==========================================
// DELETE ORDER WITH IMAGE CLEANUP (ADMIN - PROTECTED)
// ==========================================
app.delete('/api/orders/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🗑️  Delete request - Order: ${id}`);
    
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: 'Database not connected' });
    }
    
    // Find the order before deleting
    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    // Delete associated image files
    const filesToDelete = [
      order.originalImagePath,
      order.previewImagePath,
      order.uploadedImageData
    ].filter(path => path); // Remove null/undefined
    
    console.log(`📁 Deleting ${filesToDelete.length} associated files...`);
    
    for (const imagePath of filesToDelete) {
      if (imagePath) {
        const relDeletePath = String(imagePath).replace(/^\/+/, '');
        const fullPath = path.join(__dirname, 'public', relDeletePath);
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
    
    // Delete the order from database
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
});

// Public: get homepage settings (banner images + title)
app.get('/homepage', async (req, res) => {
  try {
    let doc = await Homepage.findOne().sort({ createdAt: -1 });
    if (!doc) {
      // initialize default
      doc = await Homepage.create({ title: '', bannerSlides: [], bannerImages: [] });
    }

    // If legacy bannerImages present but bannerSlides empty, migrate them into slides
    if ((!doc.bannerSlides || doc.bannerSlides.length === 0) && doc.bannerImages && doc.bannerImages.length) {
      doc.bannerSlides = doc.bannerImages.map((url, i) => ({ imageUrl: url, caption: '', ctaText: '', ctaUrl: '', order: i }));
      await doc.save();
    }

    res.json(doc);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server Error' });
  }
});

  // ----------------------------
  // Reviews API
  // ----------------------------
  // GET /reviews?productId=...
  app.get('/reviews', async (req, res) => {
    try {
      const { productId } = req.query;
      const q = {};
      if (productId) q.productId = productId;
      const reviews = await Review.find(q).sort({ createdAt: -1 }).lean();
      res.json(reviews);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server Error' });
    }
  });

  // POST /reviews
  app.post('/reviews', async (req, res) => {
    try {
      const { productId, rating, comment, userId } = req.body;
      if (!productId || !rating) return res.status(400).json({ error: 'productId and rating required' });
      if (rating < 1 || rating > 5) return res.status(400).json({ error: 'rating must be 1-5' });
      const created = await Review.create({ productId, rating, comment: comment || '', userId: userId || null });
      res.status(201).json(created);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server Error' });
    }
  });

  // ----------------------------
  // Promotions API
  // ----------------------------
  app.get('/promotions', async (req, res) => {
    try {
      const now = new Date();
      const promos = await Promotion.find({ active: true }).sort({ order: 1 }).lean();
      // filter by date if set
      const out = promos.filter(p => {
        if (p.startsAt && p.startsAt > now) return false;
        if (p.endsAt && p.endsAt < now) return false;
        return true;
      });
      res.json(out);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server Error' });
    }
  });

  // ----------------------------
  // Newsletter subscribe
  // ----------------------------
  app.post('/newsletter/subscribe', async (req, res) => {
    try {
      const { email, name } = req.body;
      if (!email || typeof email !== 'string' || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
        return res.status(400).json({ error: 'Valid email is required' });
      }
      const lower = email.toLowerCase().trim();
      const exists = await Subscriber.findOne({ email: lower });
      if (exists) return res.status(200).json({ message: 'Already subscribed' });
      const created = await Subscriber.create({ email: lower, name: name || '' });
      res.status(201).json({ message: 'Subscribed', subscriber: created });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server Error' });
    }
  });

// Protected: create or update homepage settings (admin)
app.post('/admin/homepage', authenticate, async (req, res) => {
  try {
    const { title, bannerSlides, bannerImages } = req.body || {};
    let doc = await Homepage.findOne().sort({ createdAt: -1 });
    const slides = Array.isArray(bannerSlides) ? bannerSlides.map((s, i) => ({
      imageUrl: s.imageUrl || s.url || s.imageUrl,
      caption: s.caption || '',
      ctaText: s.ctaText || '',
      ctaUrl: s.ctaUrl || '',
      order: typeof s.order === 'number' ? s.order : i,
    })) : (Array.isArray(bannerImages) ? bannerImages.map((url, i) => ({ imageUrl: url, caption: '', ctaText: '', ctaUrl: '', order: i })) : []);

    if (!doc) {
      doc = await Homepage.create({ title: title || '', bannerSlides: slides, bannerImages: Array.isArray(bannerImages) ? bannerImages : [] });
    } else {
      doc.title = title || '';
      doc.bannerSlides = slides;
      // keep bannerImages for backward compatibility
      doc.bannerImages = Array.isArray(bannerImages) ? bannerImages : doc.bannerImages || [];
      await doc.save();
    }
    res.json(doc);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server Error' });
  }
});

// Serve admin SPA for /admin and any nested admin routes so client-side router can handle paths
app.get('/admin', (req, res) => res.render('admin'));
app.get('/admin/*', (req, res) => res.render('admin'));

// Serve admin panel view (client side will validate token)
app.get('/admin', (req, res) => {
    res.render('admin');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, ()=> {
    console.log('server connected on port ' + PORT);
});

// Public: get current branding settings (single record)
app.get('/api/branding', async (req, res) => {
  try {
    const b = await BrandingSettings.findOne().sort({ updatedAt: -1 }).lean();
    if (!b) return res.json({ mainLogo: '', footerLogo: '', mobileLogo: '', favicon: '', darkLogo: '', lightLogo: '', emailLogo: '' });
    return res.json({
      mainLogo: b.mainLogo || '',
      footerLogo: b.footerLogo || '',
      mobileLogo: b.mobileLogo || '',
      favicon: b.favicon || '',
      darkLogo: b.darkLogo || '',
      lightLogo: b.lightLogo || '',
      emailLogo: b.emailLogo || ''
    });
  } catch (err) {
    console.error('GET /api/branding error', err);
    res.status(500).json({ error: 'Server Error' });
  }
});

// Admin: update branding (files allowed)
app.post('/api/admin/branding', authenticate, upload.fields([
  { name: 'mainLogo', maxCount: 1 },
  { name: 'footerLogo', maxCount: 1 },
  { name: 'mobileLogo', maxCount: 1 },
  { name: 'favicon', maxCount: 1 },
  { name: 'darkLogo', maxCount: 1 },
  { name: 'lightLogo', maxCount: 1 },
  { name: 'emailLogo', maxCount: 1 }
]), async (req, res) => {
  try {
    const files = req.files || {};
    const body = req.body || {};

    const makeUrl = (file) => file ? (`/uploads/${file.filename}`) : null;

    const payload = {
      mainLogo: makeUrl((files.mainLogo || [])[0]) || body.mainLogo || '',
      footerLogo: makeUrl((files.footerLogo || [])[0]) || body.footerLogo || '',
      mobileLogo: makeUrl((files.mobileLogo || [])[0]) || body.mobileLogo || '',
      favicon: makeUrl((files.favicon || [])[0]) || body.favicon || '',
      darkLogo: makeUrl((files.darkLogo || [])[0]) || body.darkLogo || '',
      lightLogo: makeUrl((files.lightLogo || [])[0]) || body.lightLogo || '',
      emailLogo: makeUrl((files.emailLogo || [])[0]) || body.emailLogo || ''
    };

    // Upsert single branding document
    const updated = await BrandingSettings.findOneAndUpdate({}, payload, { upsert: true, new: true, setDefaultsOnInsert: true });
    return res.json({ message: 'Branding updated', branding: updated });
  } catch (err) {
    console.error('POST /api/admin/branding error', err);
    res.status(500).json({ error: 'Failed to update branding' });
  }
});