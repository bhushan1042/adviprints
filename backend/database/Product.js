const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: String,
  category: String,
  price: Number,
  stock: Number,
  // image fields: store public URL and metadata
  imageUrl: String,
  imageFilename: String,
  imageMime: String,
  imageSize: Number,
  description: String,
  colours: [String],
  // unique product code for printing/identification
  productCode: {
    type: String,
    unique: true,
    sparse: true,
    default: null
  },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Product", productSchema);
