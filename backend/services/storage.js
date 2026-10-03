const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { v2: cloudinary } = require('cloudinary');
const { detectImageType } = require('../utils/imageType');

const PRIVATE_PREFIX = 'private:'; // Cloudinary "authenticated" asset: private:<public_id>.<format>
const LOCAL_PRIVATE_PREFIX = 'local-private:'; // development-only private file
const PUBLIC_UPLOAD_PREFIX = '/uploads/';

const PUBLIC_FOLDERS = ['products', 'categories', 'banners', 'branding', 'misc'];
const PRIVATE_FOLDERS = ['orders/original', 'orders/preview', 'orders/uploaded'];

let state = { driver: null, folder: 'adviprints', uploadsDir: null, privateDir: null };

const init = (config) => {
  state = {
    driver: config.storageDriver,
    folder: config.cloudinary.folder,
    uploadsDir: config.uploadsDir,
    privateDir: path.join(path.dirname(config.uploadsDir), 'private')
  };

  if (state.driver === 'cloudinary') {
    if (config.cloudinary.url) {
      // The SDK reads CLOUDINARY_URL from the environment.
      cloudinary.config({ secure: true });
    } else {
      cloudinary.config({
        cloud_name: config.cloudinary.cloudName,
        api_key: config.cloudinary.apiKey,
        api_secret: config.cloudinary.apiSecret,
        secure: true
      });
    }
  }
};

const randomName = () => `${Date.now()}-${crypto.randomBytes(8).toString('hex')}`;

const assertFolder = (folder, allowed) => {
  if (!allowed.includes(folder)) throw new Error(`Unknown storage folder: ${folder}`);
};

const uploadToCloudinary = (buffer, options) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (err, result) => (err ? reject(err) : resolve(result)));
    stream.end(buffer);
  });

// Safely resolves a stored relative path inside baseDir, rejecting traversal.
const resolveInside = (baseDir, relative) => {
  const full = path.resolve(baseDir, relative);
  const rel = path.relative(baseDir, full);
  if (!rel || rel.startsWith('..') || path.isAbsolute(rel)) return null;
  return full;
};

/**
 * Stores an image and returns { ref, url, mime }.
 *  - public images: ref === url (absolute https URL, or /uploads/... in local development)
 *  - private images (customer artwork): ref is an opaque reference and url is null.
 */
const saveImage = async (buffer, { folder, visibility = 'public' }) => {
  const type = detectImageType(buffer);
  if (!type) {
    const err = new Error('Unsupported or invalid image file');
    err.status = 400;
    throw err;
  }
  const isPrivate = visibility === 'private';
  assertFolder(folder, isPrivate ? PRIVATE_FOLDERS : PUBLIC_FOLDERS);

  if (state.driver === 'cloudinary') {
    const result = await uploadToCloudinary(buffer, {
      folder: `${state.folder}/${folder}`,
      resource_type: 'image',
      type: isPrivate ? 'authenticated' : 'upload',
      unique_filename: true,
      overwrite: false
    });
    if (isPrivate) {
      return { ref: `${PRIVATE_PREFIX}${result.public_id}.${result.format || type.ext}`, url: null, mime: type.mime };
    }
    return { ref: result.secure_url, url: result.secure_url, mime: type.mime };
  }

  const fileName = `${randomName()}.${type.ext}`;
  if (isPrivate) {
    const dir = path.join(state.privateDir, folder);
    fs.mkdirSync(dir, { recursive: true });
    await fs.promises.writeFile(path.join(dir, fileName), buffer);
    return { ref: `${LOCAL_PRIVATE_PREFIX}${folder}/${fileName}`, url: null, mime: type.mime };
  }
  const dir = path.join(state.uploadsDir, folder);
  fs.mkdirSync(dir, { recursive: true });
  await fs.promises.writeFile(path.join(dir, fileName), buffer);
  const url = `${PUBLIC_UPLOAD_PREFIX}${folder}/${fileName}`;
  return { ref: url, url, mime: type.mime };
};

const splitPrivateRef = (ref) => {
  const body = ref.slice(PRIVATE_PREFIX.length);
  const dot = body.lastIndexOf('.');
  return dot > 0 ? { publicId: body.slice(0, dot), format: body.slice(dot + 1) } : { publicId: body, format: undefined };
};

const signedPrivateUrl = (ref) => {
  if (!ref || !String(ref).startsWith(PRIVATE_PREFIX) || state.driver !== 'cloudinary') return null;
  const { publicId, format } = splitPrivateRef(String(ref));
  return cloudinary.url(publicId, {
    resource_type: 'image',
    type: 'authenticated',
    sign_url: true,
    secure: true,
    format
  });
};

const MIME_BY_EXT = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp', ico: 'image/x-icon' };
const mimeFromName = (name) => MIME_BY_EXT[path.extname(name).slice(1).toLowerCase()] || 'application/octet-stream';

// Legacy refs written by older versions: /uploads/<folder>/<file> on the local disk.
const resolveLegacyFile = (ref) => {
  if (!String(ref).startsWith(PUBLIC_UPLOAD_PREFIX)) return null;
  return resolveInside(state.uploadsDir, String(ref).slice(PUBLIC_UPLOAD_PREFIX.length));
};

const resolveLocalFile = (value) =>
  value.startsWith(LOCAL_PRIVATE_PREFIX)
    ? resolveInside(state.privateDir, value.slice(LOCAL_PRIVATE_PREFIX.length))
    : resolveLegacyFile(value);

/** Reads private artwork. Returns { buffer, contentType, filename } or null when it no longer exists. */
const readPrivate = async (ref) => {
  if (!ref) return null;
  const value = String(ref);

  if (value.startsWith(PRIVATE_PREFIX)) {
    const url = signedPrivateUrl(value);
    if (!url) return null;
    const response = await fetch(url);
    if (!response.ok) return null;
    const { publicId, format } = splitPrivateRef(value);
    const filename = `${path.basename(publicId)}.${format || 'png'}`;
    return {
      buffer: Buffer.from(await response.arrayBuffer()),
      contentType: response.headers.get('content-type') || mimeFromName(filename),
      filename
    };
  }

  const fullPath = resolveLocalFile(value);
  if (!fullPath || !fs.existsSync(fullPath)) return null;
  const filename = path.basename(fullPath);
  return { buffer: await fs.promises.readFile(fullPath), contentType: mimeFromName(filename), filename };
};

/** Best-effort removal of a stored asset. Never throws. */
const deleteRef = async (ref) => {
  if (!ref) return false;
  const value = String(ref);
  try {
    if (value.startsWith(PRIVATE_PREFIX)) {
      if (state.driver !== 'cloudinary') return false;
      await cloudinary.uploader.destroy(splitPrivateRef(value).publicId, {
        type: 'authenticated',
        resource_type: 'image',
        invalidate: true
      });
      return true;
    }
    const fullPath = resolveLocalFile(value);
    if (fullPath && fs.existsSync(fullPath)) {
      await fs.promises.unlink(fullPath);
      return true;
    }
  } catch (err) {
    console.error('[storage] Failed to delete asset:', err.message);
  }
  return false;
};

const isPrivateRef = (ref) => {
  const value = String(ref || '');
  return value.startsWith(PRIVATE_PREFIX) || value.startsWith(LOCAL_PRIVATE_PREFIX);
};

module.exports = {
  init,
  saveImage,
  readPrivate,
  deleteRef,
  signedPrivateUrl,
  isPrivateRef,
  PUBLIC_FOLDERS,
  PRIVATE_FOLDERS
};
