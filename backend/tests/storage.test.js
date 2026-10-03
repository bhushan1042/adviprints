const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { detectImageType, decodeBase64Image } = require('../utils/imageType');
const storage = require('../services/storage');
const { toPublicOrder, maskEmail, maskPhone } = require('../utils/orderView');

// 1x1 transparent PNG
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64'
);

const makeTempConfig = () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'adviprints-'));
  return { root, config: { storageDriver: 'local', cloudinary: { folder: 'adviprints' }, uploadsDir: path.join(root, 'uploads') } };
};

test('detects real image types from content, not from names', () => {
  assert.equal(detectImageType(PNG).mime, 'image/png');
  assert.equal(detectImageType(Buffer.from('<script>alert(1)</script>')), null);
  assert.equal(detectImageType(Buffer.from('this is plain text, not an image')), null);
  assert.equal(detectImageType(Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(20)])).mime, 'image/jpeg');
});

test('decodeBase64Image accepts data URLs and enforces the size limit', () => {
  const dataUrl = `data:image/png;base64,${PNG.toString('base64')}`;
  assert.deepEqual(decodeBase64Image(dataUrl, 1024), PNG);
  assert.equal(decodeBase64Image('', 1024), null);
  assert.throws(() => decodeBase64Image('A'.repeat(5000), 100), /too large/);
});

test('local storage keeps public and private images apart and rejects non-images', async () => {
  const { root, config } = makeTempConfig();
  storage.init(config);

  const pub = await storage.saveImage(PNG, { folder: 'products' });
  assert.match(pub.url, /^\/uploads\/products\/.+\.png$/);
  assert.ok(fs.existsSync(path.join(config.uploadsDir, 'products', path.basename(pub.url))));

  const priv = await storage.saveImage(PNG, { folder: 'orders/original', visibility: 'private' });
  assert.equal(priv.url, null);
  assert.ok(storage.isPrivateRef(priv.ref));
  // private artwork must not land inside the publicly served uploads directory
  assert.ok(!fs.existsSync(path.join(config.uploadsDir, 'orders')));

  const file = await storage.readPrivate(priv.ref);
  assert.deepEqual(file.buffer, PNG);
  assert.equal(file.contentType, 'image/png');

  await assert.rejects(storage.saveImage(Buffer.from('not an image at all, just text'), { folder: 'products' }), /Unsupported/);
  await assert.rejects(storage.saveImage(PNG, { folder: '../escape' }), /Unknown storage folder/);
  await assert.rejects(storage.saveImage(PNG, { folder: 'products', visibility: 'private' }), /Unknown storage folder/);

  assert.equal(await storage.deleteRef(priv.ref), true);
  assert.equal(await storage.readPrivate(priv.ref), null);
  fs.rmSync(root, { recursive: true, force: true });
});

test('legacy refs cannot escape the uploads directory', async () => {
  const { root, config } = makeTempConfig();
  storage.init(config);
  fs.writeFileSync(path.join(root, 'secret.txt'), 'secret');
  assert.equal(await storage.readPrivate('/uploads/../secret.txt'), null);
  assert.equal(await storage.deleteRef('/uploads/../secret.txt'), false);
  assert.ok(fs.existsSync(path.join(root, 'secret.txt')));

  fs.mkdirSync(path.join(config.uploadsDir, 'original'), { recursive: true });
  fs.writeFileSync(path.join(config.uploadsDir, 'original', 'a.png'), PNG);
  assert.deepEqual((await storage.readPrivate('/uploads/original/a.png')).buffer, PNG);
  fs.rmSync(root, { recursive: true, force: true });
});

test('public order view masks contact details and omits street address and storage refs', () => {
  const view = toPublicOrder({
    _id: 'abc',
    customerName: 'Asha',
    customerEmail: 'asha@example.com',
    customerPhone: '9876543210',
    address: { street: '12 Secret Lane', city: 'Pune', state: 'MH', zipCode: '411001', country: 'India' },
    originalImagePath: 'private:adviprints/orders/original/x.png',
    previewImagePath: 'private:adviprints/orders/preview/x.png',
    uploadedImageData: 'private:adviprints/orders/uploaded/x.png'
  });
  const json = JSON.stringify(view);
  assert.ok(!json.includes('12 Secret Lane'));
  assert.ok(!json.includes('411001'));
  assert.ok(!json.includes('asha@example.com'));
  assert.ok(!json.includes('9876543210'));
  assert.ok(!json.includes('private:'));
  assert.equal(view.address.city, 'Pune');
  assert.equal(maskEmail('asha@example.com'), 'a***@example.com');
  assert.equal(maskPhone('9876543210'), '******3210');
});
