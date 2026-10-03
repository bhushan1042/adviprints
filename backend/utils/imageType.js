// Detects the real image type from magic bytes so the declared MIME type is never trusted.
const detectImageType = (buffer) => {
  if (!Buffer.isBuffer(buffer) || buffer.length < 12) return null;

  if (buffer[0] === 0x89 && buffer.toString('ascii', 1, 4) === 'PNG') {
    return { mime: 'image/png', ext: 'png' };
  }
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { mime: 'image/jpeg', ext: 'jpg' };
  }
  const head = buffer.toString('ascii', 0, 6);
  if (head === 'GIF87a' || head === 'GIF89a') {
    return { mime: 'image/gif', ext: 'gif' };
  }
  if (buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') {
    return { mime: 'image/webp', ext: 'webp' };
  }
  if (buffer[0] === 0x00 && buffer[1] === 0x00 && buffer[2] === 0x01 && buffer[3] === 0x00) {
    return { mime: 'image/x-icon', ext: 'ico' };
  }
  return null;
};

// Decodes a data URL or raw base64 string into a Buffer, enforcing a size cap.
const decodeBase64Image = (input, maxBytes) => {
  if (typeof input !== 'string' || !input) return null;
  const payload = input.includes(',') ? input.slice(input.indexOf(',') + 1) : input;
  // Reject before decoding: base64 expands data by roughly 4/3.
  if (payload.length > Math.ceil((maxBytes * 4) / 3) + 4) {
    const err = new Error('Image is too large');
    err.status = 413;
    throw err;
  }
  const buffer = Buffer.from(payload, 'base64');
  if (!buffer.length) return null;
  return buffer;
};

module.exports = { detectImageType, decodeBase64Image };
