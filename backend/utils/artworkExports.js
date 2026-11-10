const { MAX_IMAGE_BYTES } = require('../config/multer');
const { decodeBase64Image, detectImageType } = require('./imageType');

const MAX_ARTWORK_EXPORTS = 12;
const MAX_ARTWORK_EXPORT_BYTES = 20 * 1024 * 1024;

const badRequest = (message, status = 400) => Object.assign(new Error(message), { status });

const decodeArtworkExports = (exportsValue) => {
  if (exportsValue === undefined) return [];
  if (!Array.isArray(exportsValue) || exportsValue.length > MAX_ARTWORK_EXPORTS) {
    throw badRequest(`artworkExports must be an array of at most ${MAX_ARTWORK_EXPORTS} items`);
  }
  let totalBytes = 0;
  return exportsValue.map((item, index) => {
    if (!item || typeof item !== 'object' || !['front', 'back'].includes(item.side) ||
        typeof item.zoneId !== 'string' || !item.zoneId.trim() || item.zoneId.length > 80 ||
        !Number.isInteger(item.pixelWidth) || item.pixelWidth <= 0 ||
        !Number.isInteger(item.pixelHeight) || item.pixelHeight <= 0 ||
        !Number.isFinite(Number(item.x)) || !Number.isFinite(Number(item.y)) ||
        !Number.isFinite(Number(item.width)) || Number(item.width) <= 0 ||
        !Number.isFinite(Number(item.height)) || Number(item.height) <= 0) {
      throw badRequest(`artworkExports[${index}] has invalid metadata`);
    }
    const buffer = decodeBase64Image(item.image, MAX_IMAGE_BYTES);
    if (!buffer || detectImageType(buffer)?.mime !== 'image/png') {
      throw badRequest(`artworkExports[${index}] must contain a valid PNG image`);
    }
    totalBytes += buffer.length;
    if (totalBytes > MAX_ARTWORK_EXPORT_BYTES) {
      throw badRequest('Artwork exports exceed the 20 MiB combined limit', 413);
    }
    return {
      side: item.side,
      zoneId: item.zoneId.trim(),
      zoneName: typeof item.zoneName === 'string' ? item.zoneName.trim().slice(0, 100) : '',
      x: Number(item.x),
      y: Number(item.y),
      width: Number(item.width),
      height: Number(item.height),
      pixelWidth: item.pixelWidth,
      pixelHeight: item.pixelHeight,
      buffer
    };
  });
};

module.exports = { decodeArtworkExports, MAX_ARTWORK_EXPORTS, MAX_ARTWORK_EXPORT_BYTES };
