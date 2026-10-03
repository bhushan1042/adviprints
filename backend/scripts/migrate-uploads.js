// Copies legacy local uploads (/uploads/...) to the configured storage provider and rewrites the
// database references. Non-destructive: local files are never deleted, and references whose file no
// longer exists are reported and left untouched.
//   npm run migrate-uploads            # dry run
//   npm run migrate-uploads -- --apply # perform the migration
const { getConfig } = require('../config/env');
const { connectDatabase, disconnectDatabase, isDatabaseError, formatDatabaseError } = require('../config/db');
const storage = require('../services/storage');

const Product = require('../models/Product');
const Category = require('../models/Category');
const Homepage = require('../models/Homepage');
const BrandingSettings = require('../models/BrandingSettings');
const Promotion = require('../models/Promotion');
const Order = require('../models/Order');

const apply = process.argv.includes('--apply');
const stats = { migrated: 0, missing: 0, skipped: 0, failed: 0 };
const missing = [];

const isLegacy = (value) => typeof value === 'string' && value.startsWith('/uploads/');

// Returns the new reference for a legacy value, or the original value when nothing changes.
const migrateRef = async (value, { folder, visibility }, label) => {
  if (!isLegacy(value)) {
    stats.skipped += 1;
    return value;
  }
  const file = await storage.readPrivate(value);
  if (!file) {
    stats.missing += 1;
    missing.push(`${label}: ${value}`);
    return value;
  }
  if (!apply) {
    stats.migrated += 1;
    return value;
  }
  try {
    const saved = await storage.saveImage(file.buffer, { folder, visibility });
    stats.migrated += 1;
    return saved.ref;
  } catch (err) {
    stats.failed += 1;
    console.error(`  failed ${label}: ${err.message}`);
    return value;
  }
};

const migrateFields = async (Model, fields, options) => {
  for await (const doc of Model.find().lean()) {
    const $set = {};
    for (const field of fields) {
      const next = await migrateRef(doc[field], options[field] || options, `${Model.modelName} ${doc._id}.${field}`);
      if (next !== doc[field]) $set[field] = next;
    }
    if (apply && Object.keys($set).length) await Model.updateOne({ _id: doc._id }, { $set });
  }
};

const run = async () => {
  const config = getConfig();
  if (config.storageDriver !== 'cloudinary') {
    throw new Error('Set Cloudinary credentials (STORAGE_DRIVER=cloudinary) before migrating');
  }
  storage.init(config);
  await connectDatabase(config);
  console.log(apply ? 'APPLY mode: uploading and updating references' : 'DRY RUN: nothing will be changed (use --apply)');

  await migrateFields(Product, ['imageUrl'], { folder: 'products', visibility: 'public' });
  await migrateFields(Category, ['imageUrl', 'bannerImageUrl'], { folder: 'categories', visibility: 'public' });
  await migrateFields(Promotion, ['bannerImage'], { folder: 'banners', visibility: 'public' });
  await migrateFields(
    BrandingSettings,
    ['mainLogo', 'footerLogo', 'mobileLogo', 'favicon', 'darkLogo', 'lightLogo', 'emailLogo'],
    { folder: 'branding', visibility: 'public' }
  );
  await migrateFields(Order, ['originalImagePath', 'previewImagePath', 'uploadedImageData'], {
    originalImagePath: { folder: 'orders/original', visibility: 'private' },
    previewImagePath: { folder: 'orders/preview', visibility: 'private' },
    uploadedImageData: { folder: 'orders/uploaded', visibility: 'private' }
  });

  for await (const doc of Homepage.find().lean()) {
    const slides = [];
    for (const slide of doc.bannerSlides || []) {
      const imageUrl = await migrateRef(slide.imageUrl, { folder: 'banners', visibility: 'public' }, `Homepage ${doc._id}.bannerSlides`);
      slides.push({ ...slide, imageUrl });
    }
    const images = [];
    for (const url of doc.bannerImages || []) {
      images.push(await migrateRef(url, { folder: 'banners', visibility: 'public' }, `Homepage ${doc._id}.bannerImages`));
    }
    if (apply) await Homepage.updateOne({ _id: doc._id }, { $set: { bannerSlides: slides, bannerImages: images } });
  }

  console.log(`\n${apply ? 'Migrated' : 'Would migrate'}: ${stats.migrated}  |  already migrated/other: ${stats.skipped}  |  file missing: ${stats.missing}  |  failed: ${stats.failed}`);
  if (missing.length) {
    console.log('\nThe following references point to files that no longer exist. Re-upload these in the admin panel:');
    missing.forEach((line) => console.log(`  ${line}`));
  }
  await disconnectDatabase();
};

run().catch(async (err) => {
  console.error(`FAILED: ${isDatabaseError(err) ? formatDatabaseError(err) : err.message}`);
  await disconnectDatabase().catch(() => {});
  process.exit(1);
});
