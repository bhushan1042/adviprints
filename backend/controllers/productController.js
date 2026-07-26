const Product = require('../models/Product');
const Category = require('../models/Category');
const Review = require('../models/Review');

// List all products with review aggregation
const listProducts = async (req, res) => {
  try {
    const products = await Product.aggregate([
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
          reviews: 0
        }
      }
    ]).exec();

    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server Error' });
  }
};

// Get featured products (top rated)
const getFeaturedProducts = async (req, res) => {
  try {
    const products = await Product.aggregate([
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
      { $project: { reviews: 0 } }
    ]).exec();
    res.json(products);
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
    const arrivals = await Product.find().sort({ createdAt: -1 }).limit(12).exec();
    res.json(arrivals);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server Error' });
  }
};

// Get single product
const getProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server Error' });
  }
};

// Create product
const createProduct = async (req, res) => {
  try {
    const { name, category, price, stock, imageUrl, imageFilename, imageMime, imageSize, description } = req.body;

    if (!name || price == null) return res.status(400).json({ error: 'Name and price are required' });

    let catName = null;
    if (category) {
      const cat = await Category.findById(category).catch(() => null) || await Category.findOne({ name: category }).catch(() => null);
      if (!cat) return res.status(400).json({ error: 'Category not found' });
      catName = cat.name;
    }

    const count = await Product.countDocuments();
    const productCode = `TS-${String(count + 1001).padStart(5, '0')}`;

    const createObj = { name, category: catName || category || null, price, stock: stock || 0, description, productCode };
    if (imageUrl) {
      createObj.imageUrl = imageUrl;
      createObj.imageFilename = imageFilename || null;
      createObj.imageMime = imageMime || null;
      createObj.imageSize = imageSize ? Number(imageSize) : null;
    }

    const product = await Product.create(createObj);
    return res.status(201).json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server Error' });
  }
};

// Update product
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (updates.category) {
      const cat = await Category.findById(updates.category).catch(() => null) || await Category.findOne({ name: updates.category }).catch(() => null);
      if (!cat) return res.status(400).json({ error: 'Category not found' });
      updates.category = cat.name;
    }

    if (updates.imageUrl) {
      updates.imageUrl = updates.imageUrl;
      updates.imageFilename = updates.imageFilename || updates.imageFilename;
      updates.imageMime = updates.imageMime || updates.imageMime;
      updates.imageSize = updates.imageSize ? Number(updates.imageSize) : updates.imageSize;
    }

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
  createProduct,
  updateProduct,
  deleteProduct
};
