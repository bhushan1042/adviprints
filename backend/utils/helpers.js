const mongoose = require('mongoose');
const Category = require('../models/Category');
const { createSlug } = require('./createSlug');
const { escapeRegExp } = require('./escapeRegExp');

const findCategoryByIdentifier = async (identifier) => {
  if (!identifier) return null;
  
  let category = null;
  
  // Try by ObjectId
  if (mongoose.Types.ObjectId.isValid(identifier)) {
    category = await Category.findById(identifier);
    if (category) return category;
  }
  
  // Try by slug
  const normalized = createSlug(identifier);
  if (normalized) {
    category = await Category.findOne({ slug: normalized });
    if (category) return category;
  }
  
  // Try by exact name (case-insensitive)
  category = await Category.findOne({ name: new RegExp(`^${escapeRegExp(identifier)}$`, 'i') });
  if (category) return category;
  
  // If identifier contains hyphens, try replacing with spaces
  if (identifier.includes('-')) {
    const prettyName = identifier.replace(/-/g, ' ');
    category = await Category.findOne({ name: new RegExp(`^${escapeRegExp(prettyName)}$`, 'i') });
  }
  
  return category;
};

module.exports = { findCategoryByIdentifier };
