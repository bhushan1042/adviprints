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

  // Design data
  designTemplate: String, // 'centered' or 'chest'
  originalImagePath: String, // path to uploads/original/{filename}
  previewImagePath: String, // path to uploads/preview/{filename}
  uploadedImageData: String, // base64 of user's uploaded design

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

module.exports = mongoose.model('Order', orderSchema);
