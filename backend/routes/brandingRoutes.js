const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authenticate');
const upload = require('../config/multer');
const { getBranding, updateBranding } = require('../controllers/brandingController');

// Public routes
router.get('/', getBranding);

// Protected routes
router.post('/', authenticate, upload.fields([
  { name: 'mainLogo', maxCount: 1 },
  { name: 'footerLogo', maxCount: 1 },
  { name: 'mobileLogo', maxCount: 1 },
  { name: 'favicon', maxCount: 1 },
  { name: 'darkLogo', maxCount: 1 },
  { name: 'lightLogo', maxCount: 1 },
  { name: 'emailLogo', maxCount: 1 }
]), updateBranding);

module.exports = router;
