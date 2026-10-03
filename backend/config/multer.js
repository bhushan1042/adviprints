const multer = require('multer');

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

// Files are kept in memory and streamed to the storage service; nothing is written to the app filesystem.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_IMAGE_BYTES, files: 8 },
  fileFilter: (req, file, cb) => {
    if (!/^image\//i.test(file.mimetype || '')) {
      const err = new Error('Only image uploads are allowed');
      err.status = 400;
      return cb(err);
    }
    return cb(null, true);
  }
});

module.exports = { upload, MAX_IMAGE_BYTES };
