const test = require('node:test');
const assert = require('node:assert/strict');
const { loadConfig, describeMongoTarget, ConfigError } = require('../config/env');

const prodEnv = (overrides = {}) => ({
  NODE_ENV: 'production',
  MONGODB_URI: 'mongodb+srv://user:secret@cluster0.example.mongodb.net/adviprints',
  JWT_SECRET: 'x'.repeat(40),
  CORS_ORIGINS: 'https://adviprints.example.com',
  CLOUDINARY_CLOUD_NAME: 'demo',
  CLOUDINARY_API_KEY: 'key',
  CLOUDINARY_API_SECRET: 'secret',
  ...overrides
});

test('accepts a complete production configuration', () => {
  const config = loadConfig(prodEnv());
  assert.equal(config.isProduction, true);
  assert.equal(config.storageDriver, 'cloudinary');
  assert.deepEqual(config.corsOrigins, ['https://adviprints.example.com']);
});

test('production requires MONGODB_URI and never falls back to localhost', () => {
  assert.throws(() => loadConfig(prodEnv({ MONGODB_URI: '' })), /MONGODB_URI is required/);
  assert.throws(() => loadConfig(prodEnv({ MONGODB_URI: 'mongodb://localhost:27017/bhidu' })), /localhost/);
});

test('development also requires MONGODB_URI', () => {
  assert.throws(() => loadConfig({ NODE_ENV: 'development' }), ConfigError);
});

test('production requires a strong JWT secret and explicit CORS origins', () => {
  assert.throws(() => loadConfig(prodEnv({ JWT_SECRET: 'short' })), /JWT_SECRET/);
  assert.throws(() => loadConfig(prodEnv({ JWT_SECRET: undefined })), /JWT_SECRET/);
  assert.throws(() => loadConfig(prodEnv({ CORS_ORIGINS: '' })), /CORS_ORIGINS/);
  assert.throws(() => loadConfig(prodEnv({ CORS_ORIGINS: '*' })), /CORS_ORIGINS/);
});

test('production rejects local disk storage and missing Cloudinary credentials', () => {
  assert.throws(() => loadConfig(prodEnv({ STORAGE_DRIVER: 'local' })), /not allowed in production/);
  assert.throws(
    () => loadConfig(prodEnv({ CLOUDINARY_CLOUD_NAME: '', CLOUDINARY_API_KEY: '', CLOUDINARY_API_SECRET: '' })),
    /Cloudinary credentials/
  );
});

test('CLOUDINARY_URL alone is enough', () => {
  const env = prodEnv({ CLOUDINARY_CLOUD_NAME: '', CLOUDINARY_API_KEY: '', CLOUDINARY_API_SECRET: '', CLOUDINARY_URL: 'cloudinary://k:s@demo' });
  assert.equal(loadConfig(env).storageDriver, 'cloudinary');
});

test('development defaults to local storage and a random JWT secret', () => {
  const config = loadConfig({ NODE_ENV: 'development', MONGODB_URI: 'mongodb://localhost:27017/dev' });
  assert.equal(config.storageDriver, 'local');
  assert.ok(config.jwtSecret.length >= 32);
  assert.ok(config.warnings.length > 0);
});

test('error messages never contain credentials', () => {
  try {
    loadConfig(prodEnv({ MONGODB_URI: 'mongodb://admin:hunter2@localhost/db' }));
    assert.fail('should throw');
  } catch (err) {
    assert.ok(!err.message.includes('hunter2'));
  }
});

test('describeMongoTarget hides username and password', () => {
  const target = describeMongoTarget('mongodb+srv://user:hunter2@cluster0.example.mongodb.net/adviprints?retryWrites=true');
  assert.equal(target, 'mongodb+srv://cluster0.example.mongodb.net/adviprints');
});

test('ADMIN_EMAILS is normalised', () => {
  const config = loadConfig(prodEnv({ ADMIN_EMAILS: ' Boss@Example.com , other@example.com ' }));
  assert.deepEqual(config.adminEmails, ['boss@example.com', 'other@example.com']);
});

test('MONGODB_DB_NAME overrides the URI path without dropping query parameters', () => {
  const uri = 'mongodb+srv://cluster.example/other?retryWrites=true&w=majority';
  const config = loadConfig(prodEnv({ MONGODB_URI: uri, MONGODB_DB_NAME: 'adviprints' }));

  assert.equal(config.mongodbDbName, 'adviprints');
  assert.equal(config.mongodbUri, uri);
  assert.equal(describeMongoTarget(config.mongodbUri, config.mongodbDbName), 'mongodb+srv://cluster.example/adviprints');
});
