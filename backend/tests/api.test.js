process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-test-secret-test-secret-123';
process.env.STORAGE_DRIVER = 'local';
process.env.CORS_ORIGINS = 'https://shop.example.com';
process.env.UPLOADS_DIR = require('path').join(require('os').tmpdir(), `adviprints-api-${process.pid}`, 'uploads');

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');

// No database in unit tests: pretend MongoDB is connected for the routes that never reach it.
const db = require('../config/db');
db.isDatabaseReady = () => true;

const { getConfig } = require('../config/env');
const storage = require('../services/storage');
const { createApp } = require('../app');

const config = getConfig();
storage.init(config);
const app = createApp(config);

let server;
let base;
test.before(async () => {
  await new Promise((resolve) => {
    server = app.listen(0, resolve);
  });
  base = `http://127.0.0.1:${server.address().port}`;
});
test.after(async () => {
  await new Promise((resolve) => server.close(resolve));
  fs.rmSync(path.dirname(config.uploadsDir), { recursive: true, force: true });
});

const tokenFor = (claims) => jwt.sign({ userID: '507f1f77bcf86cd799439011', email: 'a@example.com', ...claims }, config.jwtSecret, { expiresIn: '5m' });
const adminToken = () => tokenFor({ role: 'admin' });
const userToken = () => tokenFor({ role: 'user' });
const legacyToken = () => tokenFor({});
const auth = (token) => ({ headers: { Authorization: `Bearer ${token}` } });

const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64'
);

const ADMIN_ONLY = [
  ['GET', '/admin/stats'],
  ['GET', '/admin/users'],
  ['GET', '/users'],
  ['POST', '/admin/users'],
  ['POST', '/admin/homepage'],
  ['POST', '/products'],
  ['PUT', '/products/507f1f77bcf86cd799439011'],
  ['DELETE', '/products/507f1f77bcf86cd799439011'],
  ['POST', '/categories'],
  ['POST', '/homepage'],
  ['POST', '/api/branding'],
  ['POST', '/api/admin/branding'],
  ['POST', '/upload'],
  ['GET', '/api/orders'],
  ['GET', '/api/orders/public/all'],
  ['GET', '/api/orders/507f1f77bcf86cd799439011/artwork/original'],
  ['GET', '/api/orders/507f1f77bcf86cd799439011/download/original'],
  ['PUT', '/api/orders/507f1f77bcf86cd799439011'],
  ['DELETE', '/api/orders/507f1f77bcf86cd799439011']
];

test('admin endpoints reject anonymous callers with 401', async () => {
  for (const [method, url] of ADMIN_ONLY) {
    const res = await fetch(base + url, { method });
    assert.equal(res.status, 401, `${method} ${url}`);
  }
});

test('admin endpoints reject ordinary registered users with 403', async () => {
  for (const [method, url] of ADMIN_ONLY) {
    const res = await fetch(base + url, { method, ...auth(userToken()) });
    assert.equal(res.status, 403, `${method} ${url}`);
  }
});

test('tokens issued before roles existed must log in again', async () => {
  const res = await fetch(`${base}/admin/stats`, auth(legacyToken()));
  assert.equal(res.status, 401);
});

test('tokens signed with another secret or expired are rejected', async () => {
  const forged = jwt.sign({ role: 'admin' }, 'some-other-secret');
  assert.equal((await fetch(`${base}/admin/stats`, auth(forged))).status, 401);
  const expired = jwt.sign({ role: 'admin' }, config.jwtSecret, { expiresIn: -10 });
  assert.equal((await fetch(`${base}/admin/stats`, auth(expired))).status, 401);
});

test('admin panel HTML pages stay reachable without a token', async () => {
  for (const url of ['/admin', '/admin/dashboard', '/admin/users/add', '/login']) {
    const res = await fetch(base + url);
    assert.equal(res.status, 200, url);
    assert.match(res.headers.get('content-type'), /text\/html/);
  }
});

test('malformed ids are rejected with 400 before touching the database', async () => {
  assert.equal((await fetch(`${base}/api/orders/not-an-id`)).status, 400);
  assert.equal((await fetch(`${base}/products/not-an-id`)).status, 400);
  assert.equal((await fetch(`${base}/reviews?productId[$ne]=x`)).status, 400);
});

test('legacy private artwork folders are never served statically', async () => {
  const dir = path.join(config.uploadsDir, 'original');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'a.png'), PNG);
  fs.mkdirSync(path.join(config.uploadsDir, 'products'), { recursive: true });
  fs.writeFileSync(path.join(config.uploadsDir, 'products', 'b.png'), PNG);

  assert.equal((await fetch(`${base}/uploads/original/a.png`)).status, 404);
  assert.equal((await fetch(`${base}/uploads/Original/a.png`)).status, 404);
  assert.equal((await fetch(`${base}/uploads/products/b.png`)).status, 200);
});

test('admin can upload an image; non-images are rejected', async () => {
  const form = new FormData();
  form.append('image', new Blob([PNG], { type: 'image/png' }), 'logo.png');
  form.append('folder', 'branding');
  const ok = await fetch(`${base}/upload`, { method: 'POST', body: form, ...auth(adminToken()) });
  assert.equal(ok.status, 200);
  const body = await ok.json();
  assert.match(body.url, /^\/uploads\/branding\/.+\.png$/);
  assert.equal((await fetch(base + body.url)).status, 200);

  const bad = new FormData();
  bad.append('image', new Blob(['<svg onload=alert(1)>'], { type: 'image/png' }), 'evil.png');
  const rejected = await fetch(`${base}/upload`, { method: 'POST', body: bad, ...auth(adminToken()) });
  assert.equal(rejected.status, 400);

  const notImage = new FormData();
  notImage.append('image', new Blob(['hello'], { type: 'text/html' }), 'x.html');
  assert.equal((await fetch(`${base}/upload`, { method: 'POST', body: notImage, ...auth(adminToken()) })).status, 400);
});

test('CORS only allows configured origins', async () => {
  const allowed = await fetch(`${base}/api/health`, { headers: { Origin: 'https://shop.example.com' } });
  assert.equal(allowed.headers.get('access-control-allow-origin'), 'https://shop.example.com');
  const denied = await fetch(`${base}/api/health`, { headers: { Origin: 'https://evil.example.com' } });
  assert.equal(denied.headers.get('access-control-allow-origin'), null);
});

test('unknown routes and errors do not leak internals', async () => {
  const res = await fetch(`${base}/does-not-exist`);
  assert.equal(res.status, 404);
  assert.deepEqual(await res.json(), { error: 'Not Found' });

  const broken = await fetch(`${base}/products`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken()}` }, body: '{bad json' });
  assert.equal(broken.status, 400);
  const text = await broken.text();
  assert.ok(!text.includes('node_modules') && !text.includes(' at '));
});

test('security headers are set and the framework is not advertised', async () => {
  const res = await fetch(`${base}/api/health`);
  assert.equal(res.headers.get('x-powered-by'), null);
  assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
});

test('health reports unavailable when the database is down and other routes return 503', async () => {
  db.isDatabaseReady = () => false;
  try {
    // app captured the original reference at require time, so verify through a fresh app instance
    delete require.cache[require.resolve('../app')];
    const freshApp = require('../app').createApp(config);
    const srv = await new Promise((resolve) => {
      const s = freshApp.listen(0, () => resolve(s));
    });
    const url = `http://127.0.0.1:${srv.address().port}`;
    const health = await fetch(`${url}/api/health`);
    assert.equal(health.status, 503);
    assert.equal((await health.json()).mongodb, 'Disconnected');
    assert.equal((await fetch(`${url}/products`)).status, 503);
    await new Promise((resolve) => srv.close(resolve));
  } finally {
    db.isDatabaseReady = () => true;
  }
});
