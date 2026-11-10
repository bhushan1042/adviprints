const Product = require('../models/Product');
const Category = require('../models/Category');
const Review = require('../models/Review');
const mongoose = require('mongoose');
const { colourName, sameText, getApprovalProblems } = require('../utils/productVariants');
const { toPublicProduct } = require('../utils/publicProductView');
const ALLOWED_PRINT_TYPES = new Set([1, 2, 3, 5, 6, 7, 12, 13, 14, 15, 17, 23]);
const PUBLIC_FILTER = { status: 'ENABLED' };
const VARIANT_ERROR = 'Qikink variants must contain unique size/colour combinations and SKUs, a SKU up to 50 characters, and a documented integer print type ID.';

// productCode, status and createdAt are system-managed. Any edit returns the product to PENDING for re-approval.
const UPDATABLE_FIELDS = ['name', 'category', 'price', 'stock', 'imageUrl', 'imageFilename', 'imageMime', 'imageSize', 'images', 'description', 'colours', 'sizes', 'qikinkVariants'];

const cleanStringList = (value) => Array.isArray(value)
  ? [...new Set(value.filter((item) => typeof item === 'string').map((item) => item.trim()).filter(Boolean))].slice(0, 50)
  : [];

const normalizeQikinkVariants = (value) => {
  if (!Array.isArray(value)) return null;
  const seen = new Set();
  const seenSkus = new Set();
  const variants = [];
  for (const item of value) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return null;
    const size = typeof item.size === 'string' ? item.size.trim() : '';
    const colour = typeof item.colour === 'string' ? item.colour.trim() : '';
    const sku = typeof item.sku === 'string' ? item.sku.trim() : '';
    const printTypeId = item.printTypeId;
    if (!size || !colour || !sku || sku.length > 50 || !ALLOWED_PRINT_TYPES.has(printTypeId)) return null;
    const qikinkPrice = item.qikinkPrice === undefined || item.qikinkPrice === null || item.qikinkPrice === ''
      ? undefined
      : Number(item.qikinkPrice);
    if (qikinkPrice !== undefined && (!Number.isFinite(qikinkPrice) || qikinkPrice < 0.01 || qikinkPrice > 100000)) return null;
    const key = `${size.toLowerCase()}\u0000${colour.toLowerCase()}`;
    if (seen.has(key) || seenSkus.has(sku.toLowerCase())) return null;
    seen.add(key);
    seenSkus.add(sku.toLowerCase());
    variants.push(qikinkPrice === undefined ? { size, colour, sku, printTypeId } : { size, colour, sku, printTypeId, qikinkPrice });
  }
  return variants;
};

const matchesProductVariants = (variants, sizes, colours) =>
  variants.every((variant) =>
    sizes.some((size) => sameText(size, variant.size)) &&
    colours.some((colour) => sameText(colourName(colour), colourName(variant.colour)))
  );

const parsePrice = (value) => {
  const price = typeof value === 'string' && value.trim() === '' ? NaN : Number(value);
  return Number.isFinite(price) && price >= 0 ? Math.round(price * 100) / 100 : null;
};

const createProductCode = (id = new mongoose.Types.ObjectId()) => `TS-${id.toString().toUpperCase()}`;

// List public (ENABLED) products with review aggregation
const listProducts = async (req, res) => {
  try {
    const products = await Product.aggregate([
      { $match: PUBLIC_FILTER },
      { $sort: { createdAt: -1 } },
      {
        $lookup: {
          from: 'reviews',
          localField: '_id',
          foreignField: 'productId',
          as: 'reviews'
        }
      },
      {
        $addFields: {
          reviewCount: { $size: '$reviews' },
          averageRating: { $avg: '$reviews.rating' }
        }
      },
      {
        $project: {
          reviews: 0,
          qikinkVariants: 0
        }
      }
    ]).exec();

    res.json(products.map(toPublicProduct));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server Error' });
  }
};

// Get featured products (top rated)
const getFeaturedProducts = async (req, res) => {
  try {
    const products = await Product.aggregate([
      { $match: PUBLIC_FILTER },
      {
        $lookup: {
          from: 'reviews',
          localField: '_id',
          foreignField: 'productId',
          as: 'reviews'
        }
      },
      {
        $addFields: {
          reviewCount: { $size: '$reviews' },
          averageRating: { $avg: '$reviews.rating' }
        }
      },
      { $sort: { averageRating: -1, reviewCount: -1, createdAt: -1 } },
      { $limit: 8 },
      { $project: { reviews: 0, qikinkVariants: 0 } }
    ]).exec();
    res.json(products.map(toPublicProduct));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server Error' });
  }
};

// Get best sellers
const getBestSellers = async (req, res) => {
  try {
    const sellers = await Review.aggregate([
      { $group: { _id: '$productId', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 20 },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' },
      { $match: { 'product.status': 'ENABLED' } },
      {
        $project: {
          _id: '$product._id',
          name: '$product.name',
          price: '$product.price',
          imageUrl: '$product.imageUrl',
          reviewCount: '$count'
        }
      }
    ]).exec();
    res.json(sellers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server Error' });
  }
};

// Get new arrivals
const getNewArrivals = async (req, res) => {
  try {
    const arrivals = await Product.find(PUBLIC_FILTER)
      .select('-qikinkVariants -qikinkSku -qikinkPrintTypeId -qikinkFulfillment -fulfillment -fulfilment')
      .sort({ createdAt: -1 })
      .limit(12)
      .exec();
    res.json(arrivals.map(toPublicProduct));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server Error' });
  }
};

// Get single product
const getProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findOne({ _id: id, ...PUBLIC_FILTER })
      .select('-qikinkVariants -qikinkSku -qikinkPrintTypeId -qikinkFulfillment -fulfillment -fulfilment');
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(toPublicProduct(product));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server Error' });
  }
};

// Admin: every product regardless of status. Legacy documents without a status are reported as PENDING.
const listAllProductsAdmin = async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 }).lean();
    res.json(products.map((product) => ({
      ...product,
      status: product.status || 'PENDING',
      approvalProblems: getApprovalProblems(product)
    })));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server Error' });
  }
};

// Admin: approve (ENABLED) or disable (DISABLED) a product.
const setProductStatus = async (req, res) => {
  try {
    const status = req.body && req.body.status;
    if (!['ENABLED', 'DISABLED'].includes(status)) {
      return res.status(400).json({ error: 'Status must be ENABLED or DISABLED' });
    }
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    if (status === 'ENABLED') {
      const problems = getApprovalProblems(product);
      if (problems.length) {
        return res.status(400).json({ error: 'Product cannot be enabled yet.', problems });
      }
    }
    product.status = status;
    product.statusUpdatedAt = new Date();
    await product.save();
    res.json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server Error' });
  }
};

// Create product (always starts as PENDING)
const createProduct = async (req, res) => {
  try {
    const { name, category, price, stock, imageUrl, imageFilename, imageMime, imageSize, description, colours, sizes, images, qikinkVariants } = req.body;

    const parsedPrice = parsePrice(price);
    if (!name || !String(name).trim() || parsedPrice === null) {
      return res.status(400).json({ error: 'Name and a valid price are required' });
    }

    let catName = null;
    if (category) {
      const cat = await Category.findById(category).catch(() => null) || await Category.findOne({ name: category }).catch(() => null);
      if (!cat) return res.status(400).json({ error: 'Category not found' });
      catName = cat.name;
    }

    const cleanSizes = cleanStringList(sizes);
    const cleanColours = cleanStringList(colours);
    let variants = [];
    if (qikinkVariants !== undefined) {
      variants = normalizeQikinkVariants(qikinkVariants);
      if (!variants) return res.status(400).json({ error: VARIANT_ERROR });
      if (!matchesProductVariants(variants, cleanSizes, cleanColours)) {
        return res.status(400).json({ error: 'Each Qikink mapping must match a configured product size and colour.' });
      }
    }

    const productId = new mongoose.Types.ObjectId();
    const productCode = createProductCode(productId);

    const createObj = {
      _id: productId,
      name: String(name).trim(),
      category: catName || category || null,
      price: parsedPrice,
      stock: stock || 0,
      description,
      productCode,
      colours: cleanColours,
      sizes: cleanSizes,
      images: cleanStringList(images).slice(0, 10),
      qikinkVariants: variants,
      status: 'PENDING'
    };
    if (imageUrl) {
      createObj.imageUrl = imageUrl;
      createObj.imageFilename = imageFilename || null;
      createObj.imageMime = imageMime || null;
      createObj.imageSize = imageSize ? Number(imageSize) : null;
    }

    const product = await Product.create(createObj);
    return res.status(201).json(product);
  } catch (error) {
    if (error && error.code === 11000) {
      console.error('[products] create failed due to a duplicate product identifier');
      return res.status(409).json({ error: 'Product could not be saved because its identifier already exists. Please try again.' });
    }
    console.error(error);
    res.status(500).json({ error: 'Server Error' });
  }
};

// Update product
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = {};
    for (const key of UPDATABLE_FIELDS) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    if (updates.colours !== undefined) updates.colours = cleanStringList(updates.colours);
    if (updates.sizes !== undefined) updates.sizes = cleanStringList(updates.sizes);
    if (updates.images !== undefined) updates.images = cleanStringList(updates.images).slice(0, 10);
    if (updates.price !== undefined) {
      const price = parsePrice(updates.price);
      if (price === null) return res.status(400).json({ error: 'A valid price is required' });
      updates.price = price;
    }
    if (updates.name !== undefined && !String(updates.name).trim()) {
      return res.status(400).json({ error: 'Product title cannot be empty' });
    }
    if (updates.qikinkVariants !== undefined) {
      const variants = normalizeQikinkVariants(updates.qikinkVariants);
      if (!variants) return res.status(400).json({ error: VARIANT_ERROR });
      const currentProduct = await Product.findById(id).select('sizes colours').lean();
      if (!currentProduct) return res.status(404).json({ error: 'Product not found' });
      const sizes = updates.sizes || currentProduct.sizes || [];
      const colours = updates.colours || currentProduct.colours || [];
      if (!matchesProductVariants(variants, sizes, colours)) {
        return res.status(400).json({ error: 'Each Qikink mapping must match a configured product size and colour.' });
      }
      updates.qikinkVariants = variants;
    }

    if (updates.category) {
      const cat = await Category.findById(updates.category).catch(() => null) || await Category.findOne({ name: updates.category }).catch(() => null);
      if (!cat) return res.status(400).json({ error: 'Category not found' });
      updates.category = cat.name;
    }

    if (updates.imageSize) updates.imageSize = Number(updates.imageSize);

    // Every saved edit requires the admin to approve the product again.
    updates.status = 'PENDING';
    updates.statusUpdatedAt = new Date();

    const updated = await Product.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
    if (!updated) return res.status(404).json({ error: 'Product not found' });
    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server Error' });
  }
};

// Delete product
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const removed = await Product.findByIdAndDelete(id);
    if (!removed) return res.status(404).json({ error: 'Product not found' });
    res.json({ message: 'Product deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server Error' });
  }
};

module.exports = {
  listProducts,
  getFeaturedProducts,
  getBestSellers,
  getNewArrivals,
  getProduct,
  listAllProductsAdmin,
  setProductStatus,
  createProduct,
  updateProduct,
  deleteProduct,
  createProductCode,
  normalizeQikinkVariants,
  matchesProductVariants
};
