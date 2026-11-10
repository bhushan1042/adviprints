const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  // Customer information
  customerName: {
    type: String,
    required: true
  },
  customerEmail: {
    type: String,
    required: true
  },
  customerPhone: {
    type: String,
    required: true
  },

  // Shipping address
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },

  // Product information
  productId: mongoose.Schema.Types.ObjectId,
  productName: String,
  productPrice: Number,
  productCode: String, // unique product code for printing
  size: String,
  colour: String,
  // Purchase snapshot: the exact Qikink variant resolved on the server at order time.
  productImageUrl: String,
  qikinkSku: String,
  qikinkPrintTypeId: Number,
  lineItems: {
    type: [{
      productId: { type: mongoose.Schema.Types.ObjectId, required: true },
      productName: { type: String, required: true },
      productPrice: { type: Number, required: true },
      productCode: String,
      productImageUrl: String,
      size: String,
      colour: String,
      qikinkSku: { type: String, required: true },
      qikinkPrintTypeId: Number,
      qikinkPrice: Number,
      quantity: { type: Number, required: true },
      totalPrice: { type: Number, required: true }
    }],
    default: []
  },
  checkoutId: { type: String, unique: true, sparse: true },

  // Design data (legacy customer-design orders only; the current workflow sells ready-designed products)
  designTemplate: String, // 'centered' or 'chest'
  originalImagePath: String, // path to uploads/original/{filename}
  previewImagePath: String, // path to uploads/preview/{filename}
  uploadedImageData: String, // base64 of user's uploaded design
  artworkExports: {
    type: [{
      side: { type: String, enum: ['front', 'back'], required: true },
      zoneId: { type: String, required: true, maxlength: 80 },
      zoneName: { type: String, maxlength: 100 },
      x: Number,
      y: Number,
      width: Number,
      height: Number,
      pixelWidth: { type: Number, required: true },
      pixelHeight: { type: Number, required: true },
      imagePath: { type: String, required: true }
    }],
    default: []
  },

  // Design positioning
  position: {
    x: Number,
    y: Number,
    scaleX: Number,
    scaleY: Number,
    rotation: Number
  },

  // Order details
  quantity: {
    type: Number,
    default: 1
  },
  totalPrice: Number,
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'cancelled'],
    default: 'pending'
  },
  paymentMethod: String, // 'card', 'upi', 'cod'
  qikinkFulfillment: {
    state: {
      type: String,
      enum: ['not_configured', 'ready', 'submitting', 'submitted', 'rejected', 'outcome_unknown'],
      default: 'not_configured'
    },
    orderId: String,
    // Unique order_number sent to Qikink (<= 15 chars, [a-z0-9_]); generated before submission.
    reference: String,
    rawStatus: String,
    shippingType: String,
    deliveredOn: String,
    lastError: String,
    response: { message: String, orderId: String, statusCode: String },
    submittedAt: Date,
    lastSyncedAt: Date
  },

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

orderSchema.index(
  { 'qikinkFulfillment.reference': 1 },
  { unique: true, sparse: true, name: 'qikink_reference_unique_sparse' }
);

module.exports = mongoose.model('Order', orderSchema);
