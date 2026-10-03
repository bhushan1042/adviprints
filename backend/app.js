const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const { isDatabaseReady } = require('./config/db');
const { upload } = require('./config/multer');
const { requireAdmin } = require('./middleware/authenticate');
const { generalLimiter } = require('./middleware/rateLimiters');
const errorHandler = require('./middleware/errorHandler');
const notFoundHandler = require('./middleware/notFound');
const { uploadImage } = require('./controllers/uploadController');

const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const homepageRoutes = require('./routes/homepageRoutes');
const orderRoutes = require('./routes/orderRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const promotionRoutes = require('./routes/promotionRoutes');
const subscriberRoutes = require('./routes/subscriberRoutes');
const brandingRoutes = require('./routes/brandingRoutes');
const { adminRouter, usersRouter } = require('./routes/adminRoutes');

// Legacy uploads written by older versions live under these folders; they hold private customer
// artwork and must never be served statically.
const PRIVATE_LEGACY_PATH = /^\/(original|preview|uploaded)(\/|$)/i;

const createApp = (config) => {
  const app = express();

  // Render terminates TLS in front of the app; needed for correct client IPs (rate limiting).
  app.set('trust proxy', 1);
  app.set('view engine', 'ejs');
  app.set('views', path.join(__dirname, 'views'));

  // The built-in admin panel relies on inline scripts, so CSP is disabled. Images are loaded
  // cross-origin by the React frontend, hence the relaxed resource policy.
  app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: { policy: 'cross-origin' } }));

  const allowedOrigins = new Set(config.corsOrigins);
  app.use(
    cors({
      origin: (origin, callback) => {
        // Requests without an Origin header (same-origin pages, curl, health checks) are not CORS requests.
        if (!origin || allowedOrigins.has(origin)) return callback(null, true);
        return callback(null, false);
      },
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization']
    })
  );

  // Liveness/readiness for the platform health check; intentionally above the database guard.
  app.get('/api/health', (req, res) => {
    const connected = isDatabaseReady();
    res.status(connected ? 200 : 503).json({
      status: connected ? 'OK' : 'UNAVAILABLE',
      mongodb: connected ? 'Connected' : 'Disconnected',
      timestamp: new Date().toISOString()
    });
  });

  // Legacy public images (/uploads/<folder>/<file>); new uploads are served by the storage provider.
  app.use('/uploads', (req, res, next) => (PRIVATE_LEGACY_PATH.test(req.path) ? res.status(404).end() : next()));
  app.use('/uploads', express.static(config.uploadsDir, { index: false, dotfiles: 'ignore', maxAge: '1d' }));

  app.use(generalLimiter);

  // The order endpoint parses its own (larger) JSON body because customer artwork arrives as base64.
  const jsonParser = express.json({ limit: '1mb' });
  app.use((req, res, next) => (req.method === 'POST' && req.path === '/api/orders' ? next() : jsonParser(req, res, next)));
  app.use(express.urlencoded({ extended: false, limit: '100kb' }));

  // Everything below needs MongoDB.
  app.use((req, res, next) => {
    if (isDatabaseReady()) return next();
    return res.status(503).json({ error: 'Service temporarily unavailable' });
  });

  // Admin panel pages
  app.post('/register', (req, res) => res.render('index'));
  app.get('/login', (req, res) => res.render('index'));
  app.get('/register', (req, res) => res.render('register'));

  app.use('/', authRoutes);

  app.use('/products', productRoutes);
  app.use('/categories', categoryRoutes);
  app.use('/homepage', homepageRoutes);
  app.use('/api/orders', orderRoutes);
  app.use('/reviews', reviewRoutes);
  app.use('/promotions', promotionRoutes);
  app.use('/newsletter', subscriberRoutes);
  app.use('/api/branding', brandingRoutes);
  app.use('/api/admin/branding', brandingRoutes); // path used by the admin panels
  app.use('/admin', adminRouter);
  app.use('/users', usersRouter);

  app.post('/upload', requireAdmin, upload.single('image'), uploadImage);

  app.get('/admin', (req, res) => res.render('admin'));
  app.get('/admin/*', (req, res) => res.render('admin'));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};

module.exports = { createApp };
