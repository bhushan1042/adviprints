const test = require('node:test');
const assert = require('node:assert/strict');
const { decodeArtworkExports } = require('../utils/artworkExports');

const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64'
);

const exportItem = (overrides = {}) => ({
  side: 'front',
  zoneId: 'center-chest',
  zoneName: 'Center Chest',
  x: 100,
  y: 120,
  width: 180,
  height: 150,
  pixelWidth: 360,
  pixelHeight: 300,
  image: `data:image/png;base64,${PNG.toString('base64')}`,
  ...overrides
});

test('decodes an editor-zone PNG and preserves pixel-only metadata', () => {
  const [decoded] = decodeArtworkExports([exportItem()]);
  assert.deepEqual(decoded.buffer, PNG);
  assert.equal(decoded.side, 'front');
  assert.equal(decoded.pixelWidth, 360);
  assert.equal(decoded.width, 180);
  assert.equal(decoded.zoneId, 'center-chest');
});

test('allows no exports for legacy designs', () => {
  assert.deepEqual(decodeArtworkExports(undefined), []);
  assert.deepEqual(decodeArtworkExports([]), []);
});

test('rejects invalid metadata, non-PNG content and too many exports', () => {
  assert.throws(() => decodeArtworkExports([exportItem({ side: 'left' })]), /invalid metadata/);
  assert.throws(() => decodeArtworkExports([exportItem({ image: 'data:image/png;base64,SGVsbG8=' })]), /valid PNG/);
  assert.throws(() => decodeArtworkExports(Array.from({ length: 13 }, () => exportItem())), /at most 12/);
});
