import api from './api';
import { resolveImageUrl } from '../utils/images';
import categoryPlaceholder from '../assets/placeholders/category-placeholder.png';

export const slugify = (value = '') => String(value)
  .trim()
  .toLowerCase()
  .replace(/\s+/g, '-')
  .replace(/[^a-z0-9-]/g, '')
  .replace(/-+/g, '-')
  .replace(/^-+|-+$/g, '');

const asList = (value) => {
  if (Array.isArray(value)) return value;
  if (value && Array.isArray(value.value)) return value.value;
  return [];
};

export const mapCategory = (category, index = 0) => ({
  ...category,
  id: category?._id || category?.id || `category-${index}`,
  slug: category?.slug || slugify(category?.name),
  name: category?.name || 'Category',
  image: resolveImageUrl(
    category?.bannerImageUrl || category?.imageUrl || category?.image,
    categoryPlaceholder
  ),
  styles: 'Explore collection'
});

export const mapProduct = (product, categories = []) => {
  const rawCategory = product?.category;
  const category = categories.find((item) =>
    item.id === String(rawCategory || '') ||
    item.name?.toLowerCase() === String(rawCategory || '').toLowerCase()
  );
  const colours = Array.isArray(product?.colours) ? product.colours : [];
  const images = [
    product?.imageUrl,
    product?.image,
    ...(Array.isArray(product?.images) ? product.images : [])
  ]
    .map((image) => resolveImageUrl(image, ''))
    .filter(Boolean);

  return {
    ...product,
    id: String(product?._id || product?.id || ''),
    slug: String(product?._id || product?.id || ''),
    category: category?.slug || slugify(rawCategory),
    categoryName: category?.name || String(rawCategory || ''),
    tags: [],
    colors: colours.map((colour) => ({
      name: String(colour),
      hex: String(colour)
    })),
    sizes: Array.isArray(product?.sizes) ? product.sizes : [],
    images: [...new Set(images.length ? images : [categoryPlaceholder])],
    rating: Number(product?.averageRating) || 0,
    reviewCount: Number(product?.reviewCount) || 0,
    originalPrice: Number(product?.originalPrice) || undefined,
    price: Number(product?.price) || 0,
    description: product?.description || '',
    features: []
  };
};

export const listCategories = async (signal) => {
  const { data } = await api.get('/categories', { signal });
  return asList(data).map(mapCategory);
};

export const listProducts = async (categories = [], signal) => {
  const { data } = await api.get('/products', { signal });
  return asList(data).map((product) => mapProduct(product, categories));
};

export const listCategoryProducts = async (identifier, categories = [], signal) => {
  const { data } = await api.get(`/categories/${encodeURIComponent(identifier)}/products`, { signal });
  return asList(data).map((product) => mapProduct(product, categories));
};

export const getProduct = async (id, signal, categories = []) => {
  const { data } = await api.get(`/products/${encodeURIComponent(id)}`, { signal });
  return mapProduct(data, categories);
};

export const listProductReviews = async (productId, signal) => {
  const { data } = await api.get('/reviews', {
    params: { productId },
    signal
  });
  return asList(data);
};
