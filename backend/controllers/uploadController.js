const { saveImage, PUBLIC_FOLDERS } = require('../services/storage');

// POST /upload (admin): stores one public image and returns its URL.
const uploadImage = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const requested = (req.body && req.body.folder) || req.query.folder;
    const folder = PUBLIC_FOLDERS.includes(requested) ? requested : 'misc';

    const saved = await saveImage(req.file.buffer, { folder, visibility: 'public' });
    res.json({
      url: saved.url,
      filename: req.file.originalname,
      mimetype: saved.mime,
      size: req.file.size
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { uploadImage };
