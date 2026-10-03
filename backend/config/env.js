const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class ConfigError extends Error {}

// Loads backend/.env for local development only. Production variables must come from the host.
const loadDotEnv = () => {
  if (process.env.NODE_ENV === 'production') return;
  const envFile = path.join(__dirname, '..', '.env');
  if (typeof process.loadEnvFile === 'function' && fs.existsSync(envFile)) {
    process.loadEnvFile(envFile);
  }
};

const list = (value) =>
  String(value || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

// Never log the full connection string: it contains credentials.
const describeMongoTarget = (uri) => {
  try {
    const url = new URL(uri);
    const dbName = url.pathname.replace(/^\//, '');
    return `${url.protocol}//${url.hostname}${dbName ? `/${dbName}` : ''}`;
  } catch (e) {
    return '(unparseable MongoDB URI)';
  }
};

const LOCAL_HOSTS = /(^|[@/])(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\])(:|\/|$)/i;

const loadConfig = (env = process.env) => {
  const errors = [];
  const warnings = [];
  const nodeEnv = env.NODE_ENV || 'development';
  const isProduction = nodeEnv === 'production';
  const isTest = nodeEnv === 'test';

  const port = Number(env.PORT || 5000);
  if (!Number.isInteger(port) || port <= 0) errors.push('PORT must be a positive integer');

  const mongodbUri = (env.MONGODB_URI || '').trim();
  if (!mongodbUri) {
    if (!isTest) errors.push('MONGODB_URI is required (there is no localhost fallback)');
  } else if (!/^mongodb(\+srv)?:\/\//.test(mongodbUri)) {
    errors.push('MONGODB_URI must start with mongodb:// or mongodb+srv://');
  } else if (isProduction && LOCAL_HOSTS.test(mongodbUri)) {
    errors.push('MONGODB_URI points to localhost, which is not allowed in production');
  }

  let jwtSecret = env.JWT_SECRET || '';
  if (isProduction) {
    if (jwtSecret.length < 32) errors.push('JWT_SECRET is required in production and must be at least 32 characters');
    if (jwtSecret === 'change_this_secret') errors.push('JWT_SECRET must not be the old default value');
  } else if (!jwtSecret) {
    // Ephemeral secret: tokens stop working on restart, which is acceptable outside production.
    jwtSecret = crypto.randomBytes(32).toString('hex');
    warnings.push('JWT_SECRET is not set; using a random per-process secret (tokens reset on restart)');
  }

  let corsOrigins = list(env.CORS_ORIGINS);
  if (isProduction && corsOrigins.length === 0) {
    errors.push('CORS_ORIGINS is required in production (comma-separated list of frontend origins)');
  }
  if (!isProduction && corsOrigins.length === 0) corsOrigins = ['http://localhost:3000'];
  if (corsOrigins.includes('*') && isProduction) errors.push('CORS_ORIGINS must not contain * in production');

  const cloudinaryUrl = (env.CLOUDINARY_URL || '').trim();
  const cloudinary = {
    url: cloudinaryUrl,
    cloudName: (env.CLOUDINARY_CLOUD_NAME || '').trim(),
    apiKey: (env.CLOUDINARY_API_KEY || '').trim(),
    apiSecret: (env.CLOUDINARY_API_SECRET || '').trim(),
    folder: (env.CLOUDINARY_FOLDER || 'adviprints').trim().replace(/^\/+|\/+$/g, '')
  };
  const hasCloudinary = Boolean(cloudinary.url || (cloudinary.cloudName && cloudinary.apiKey && cloudinary.apiSecret));

  const requestedDriver = (env.STORAGE_DRIVER || '').trim().toLowerCase();
  const storageDriver = requestedDriver || (hasCloudinary || isProduction ? 'cloudinary' : 'local');
  if (!['cloudinary', 'local'].includes(storageDriver)) {
    errors.push('STORAGE_DRIVER must be "cloudinary" or "local"');
  } else if (storageDriver === 'local' && isProduction) {
    errors.push('STORAGE_DRIVER=local is not allowed in production: the host filesystem is ephemeral');
  } else if (storageDriver === 'cloudinary' && !hasCloudinary) {
    errors.push('Cloudinary credentials are required: set CLOUDINARY_URL or CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET');
  }

  if (errors.length) {
    throw new ConfigError(`Invalid configuration:\n - ${errors.join('\n - ')}`);
  }

  return Object.freeze({
    nodeEnv,
    isProduction,
    isTest,
    port,
    mongodbUri,
    mongodbDbName: (env.MONGODB_DB_NAME || '').trim() || undefined,
    jwtSecret,
    jwtExpiresIn: env.JWT_EXPIRES_IN || '1h',
    corsOrigins,
    adminEmails: list(env.ADMIN_EMAILS).map((e) => e.toLowerCase()),
    storageDriver,
    cloudinary,
    // Legacy uploads written by older versions and local-driver files in development.
    uploadsDir: path.resolve(env.UPLOADS_DIR || path.join(__dirname, '..', 'public', 'uploads')),
    warnings
  });
};

let cached = null;
const getConfig = () => {
  if (!cached) {
    loadDotEnv();
    cached = loadConfig();
  }
  return cached;
};

module.exports = { loadConfig, getConfig, loadDotEnv, describeMongoTarget, ConfigError };
