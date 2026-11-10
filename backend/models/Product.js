const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: String,
  category: String,
  price: Number,
  stock: Number,
  // image fields: store public URL and metadata
  imageUrl: String,
  thumbnailUrl: String,
  imageFilename: String,
  imageMime: String,
  imageSize: Number,
  description: String,
  colours: [String],
  sizes: { type: [String], default: [] },
  // Additional gallery images (imageUrl is the primary image).
  images: { type: [String], default: [] },
  // Only ENABLED products are public and orderable. Legacy documents without a status are treated as not public.
  status: { type: String, enum: ['PENDING', 'ENABLED', 'DISABLED'], default: 'PENDING', index: true },
  statusUpdatedAt: Date,
  qikinkVariants: {
    type: [{
      size: { type: String, required: true, trim: true },
      colour: { type: String, required: true, trim: true },
      sku: { type: String, required: true, trim: true, maxlength: 50 },
      printTypeId: { type: Number, enum: [1, 2, 3, 5, 6, 7, 12, 13, 14, 15, 17, 23] },
      productSku: { type: String, trim: true, maxlength: 100 },
      designSku: { type: String, trim: true, maxlength: 100 },
      // Qikink line-item price (the product price Qikink bills), sent as a string in create-order.
      qikinkPrice: { type: Number, min: 0.01, max: 100000 }
    }],
    default: []
  },
  qikinkExcludedVariants: {
    type: [{ size: { type: String, required: true, trim: true }, colour: { type: String, required: true, trim: true } }],
    default: []
  },
  // unique product code for printing/identification
  productCode: {
    type: String,
    unique: true,
    sparse: true,
    default: null
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Product', productSchema);
