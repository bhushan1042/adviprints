const Category = require('../models/Category');
const Product = require('../models/Product');
const { createSlug } = require('../utils/createSlug');
const { findCategoryByIdentifier } = require('../utils/helpers');

// List all categories
const listCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ createdAt: -1 });
    res.json(categories);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server Error' });
  }
};

// Get single category
const getCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await findCategoryByIdentifier(id);
    if (!category) return res.status(404).json({ error: 'Category not found' });
    res.json(category);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server Error' });
  }
};

// Get products for a category
const getCategoryProducts = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await findCategoryByIdentifier(id);
    if (!category) return res.status(404).json({ error: 'Category not found' });

    const cid = category._id.toString();
    const products = await Product.find({
      $or: [
        { category: category.name },
        { category: cid },
        { categoryId: cid }
      ]
    }).sort({ createdAt: -1 });

    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server Error' });
  }
};

// Create category
const createCategory = async (req, res) => {
  try {
    const { name, slug, description, imageUrl, bannerImageUrl, showcaseTitle, showcaseSubtitle, showcaseFeatures, showcaseCtaText } = req.body;

    if (!name) return res.status(400).json({ error: 'Name is required' });

    const exists = await Category.findOne({ name });
    if (exists) return res.status(400).json({ error: 'Category already exists' });

    const createObj = { name, description, imageUrl: imageUrl || null, bannerImageUrl: bannerImageUrl || null };

    const normalizedSlug = createSlug(slug || name);
    if (normalizedSlug) createObj.slug = normalizedSlug;

    if (showcaseTitle) createObj.showcaseTitle = showcaseTitle;
    if (showcaseSubtitle) createObj.showcaseSubtitle = showcaseSubtitle;
    if (Array.isArray(showcaseFeatures)) createObj.showcaseFeatures = showcaseFeatures;
    else if (typeof showcaseFeatures === 'string' && showcaseFeatures.trim()) createObj.showcaseFeatures = showcaseFeatures.split('\n').map(s => s.trim()).filter(Boolean);
    if (showcaseCtaText) createObj.showcaseCtaText = showcaseCtaText;

    const category = await Category.create(createObj);
    res.status(201).json(category);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server Error' });
  }
};

// Update category
const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const allowed = ['name', 'slug', 'description', 'imageUrl', 'bannerImageUrl', 'showcaseTitle', 'showcaseSubtitle', 'showcaseFeatures', 'showcaseCtaText'];
    const patch = {};

    for (const k of allowed) {
      if (updates[k] !== undefined) patch[k] = updates[k];
    }

    if (typeof patch.name === 'string' && !patch.slug) {
      patch.slug = createSlug(patch.name);
    }

    if (patch.slug) patch.slug = createSlug(patch.slug);

    if (patch.showcaseFeatures && typeof patch.showcaseFeatures === 'string') {
      patch.showcaseFeatures = patch.showcaseFeatures.split('\n').map(s => s.trim()).filter(Boolean);
    }

    const updated = await Category.findByIdAndUpdate(id, patch, { new: true, runValidators: true });
    if (!updated) return res.status(404).json({ error: 'Category not found' });
    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server Error' });
  }
};

// Delete category
const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const removed = await Category.findByIdAndDelete(id);
    if (!removed) return res.status(404).json({ error: 'Category not found' });

    // Optionally remove or reassign products in this category
    await Product.updateMany({ category: removed.name }, { $set: { category: null } });

    res.json({ message: 'Category deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server Error' });
  }
};

module.exports = {
  listCategories,
  getCategory,
  getCategoryProducts,
  createCategory,
  updateCategory,
  deleteCategory
};
