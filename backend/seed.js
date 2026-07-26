const mongoose = require('mongoose');
const Product = require('./database/Product');
const Category = require('./database/Category');
const Homepage = require('./database/Homepage');
const Promotion = require('./database/Promotion');
const Review = require('./database/Review');
const Subscriber = require('./database/Subscriber');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bhidu';

async function run() {
  await mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('Connected to MongoDB for seeding');

  // clear small sets (be careful in production!)
  await Category.deleteMany({});
  await Product.deleteMany({});
  await Homepage.deleteMany({});
  await Promotion.deleteMany({});
  await Review.deleteMany({});
  await Subscriber.deleteMany({});

  const cats = await Category.insertMany([
    { name: 'T-Shirts', description: 'Custom printed tees', imageUrl: '/uploads/example-category-tshirt.jpg' },
    { name: 'Mugs', description: 'Personalized mugs', imageUrl: '/uploads/example-category-mug.jpg' },
    { name: 'Hoodies', description: 'Warm hoodies', imageUrl: '/uploads/example-category-hoodie.jpg' },
    { name: 'Stickers', description: 'Fun stickers', imageUrl: '/uploads/example-category-sticker.jpg' }
  ]);

  const products = await Product.insertMany([
    { name: 'Classic Tee', category: 'T-Shirts', price: 399, stock: 50, imageUrl: '/uploads/sample-tee-1.png' },
    { name: 'Premium Mug', category: 'Mugs', price: 299, stock: 120, imageUrl: '/uploads/sample-mug-1.png' },
    { name: 'Cozy Hoodie', category: 'Hoodies', price: 899, stock: 30, imageUrl: '/uploads/sample-hoodie-1.png' },
    { name: 'Sticker Pack', category: 'Stickers', price: 149, stock: 200, imageUrl: '/uploads/sample-sticker-1.png' }
  ]);

  await Homepage.create({
    title: 'Design Your Own Custom T-Shirts',
    bannerSlides: [
      { imageUrl: '/uploads/hero1.png', caption: 'Design Your Own Custom T-Shirts', ctaText: 'Start Designing', ctaUrl: '/design', order: 0 },
      { imageUrl: '/uploads/hero2.png', caption: 'Upload your design and get premium quality prints delivered.', ctaText: 'Shop Collection', ctaUrl: '/collections', order: 1 }
    ]
  });

  await Promotion.insertMany([
    { title: 'Free Shipping Above ₹999', description: 'Enjoy free shipping on orders above ₹999', active: true, order: 1 },
    { title: '15% Off On First Order', description: 'Use code FIRST15 at checkout', active: true, order: 2 }
  ]);

  await Review.insertMany([
    { productId: products[0]._id, rating: 5, comment: 'Amazing print quality!' },
    { productId: products[1]._id, rating: 4, comment: 'Very good mug' },
    { productId: products[2]._id, rating: 5, comment: 'Hoodie is super cozy' }
  ]);

  await Subscriber.create({ email: 'test@example.com', name: 'Tester' });

  console.log('Seeding completed');
  process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });
