const test = require('node:test');
const assert = require('node:assert/strict');
const Product = require('../models/Product');
const Order = require('../models/Order');
const {
  normalizeQikinkVariants,
  matchesProductVariants,
  createProduct,
  updateProduct,
  createProductCode,
  listAllProductsAdmin
} = require('../controllers/productController');

test('normalizes valid exact variant SKU mappings', () => {
  const mappings = normalizeQikinkVariants([
    { size: ' M ', colour: ' Black ', sku: ' QK-BLK-M ', printTypeId: 1 }
  ]);
  assert.deepEqual(mappings, [{ size: 'M', colour: 'Black', sku: 'QK-BLK-M', printTypeId: 1 }]);
  assert.equal(matchesProductVariants(mappings, ['M'], ['Black']), true);
});

test('rejects duplicate and invalid variant mapping shapes', () => {
  assert.equal(normalizeQikinkVariants([
    { size: 'M', colour: 'Black', sku: 'sku-1', printTypeId: 1 },
    { size: 'm', colour: 'black', sku: 'sku-2', printTypeId: 1 }
  ]), null);
  assert.equal(normalizeQikinkVariants([
    { size: 'M', colour: 'Black', sku: 'same-sku', printTypeId: 1 },
    { size: 'L', colour: 'Black', sku: 'SAME-SKU', printTypeId: 1 }
  ]), null);
  assert.equal(normalizeQikinkVariants([{ size: 'M', colour: 'Black', sku: 'sku', printTypeId: '1' }]), null);
  assert.equal(normalizeQikinkVariants([{ size: 'M', colour: 'Black', sku: 'x'.repeat(51), printTypeId: 1 }]), null);
  assert.equal(normalizeQikinkVariants([{ size: 'M', colour: 'Black', sku: 'sku', printTypeId: 4 }]), null);
});

test('preserves valid Qikink prices and rejects invalid prices', () => {
  const variant = { size: 'M', colour: 'Black', sku: 'sku', printTypeId: 1 };
  assert.deepEqual(normalizeQikinkVariants([{ ...variant, qikinkPrice: '105.50' }]), [{ ...variant, qikinkPrice: 105.5 }]);
  assert.deepEqual(normalizeQikinkVariants([{ ...variant, qikinkPrice: '' }]), [variant]);
  for (const qikinkPrice of [0, -1, 100001, 'invalid']) {
    assert.equal(normalizeQikinkVariants([{ ...variant, qikinkPrice }]), null);
  }
});

test('preserves reference SKUs without requiring a print type for My Products', () => {
  const variant = { size: 'M', colour: 'White', sku: 'store-sku', productSku: 'product-sku', designSku: 'design-sku', qikinkPrice: 305.48 };
  assert.deepEqual(normalizeQikinkVariants([variant]), [variant]);
  assert.equal(normalizeQikinkVariants([{ ...variant, productSku: 'x'.repeat(101) }]), null);
  const product = new Product({ qikinkVariants: [variant] });
  assert.equal(product.validateSync(), undefined);
  const order = new Order({ lineItems: [{ productId: 'aaaaaaaaaaaaaaaaaaaaaaaa', productName: 'Product', productPrice: 500, size: 'M', colour: 'White', qikinkSku: 'store-sku', qikinkPrice: 305.48, quantity: 1, totalPrice: 500 }] });
  const error = order.validateSync();
  assert.ok(!error || !error.errors['lineItems.0.qikinkPrintTypeId']);
});

test('blocks a mapped size or colour that is not configured for the product', () => {
  const mappings = [{ size: 'M', colour: 'Black', sku: 'QK-BLK-M', printTypeId: 1 }];
  assert.equal(matchesProductVariants(mappings, ['S', 'M'], ['Black']), true);
  assert.equal(matchesProductVariants(mappings, ['S'], ['Black']), false);
  assert.equal(matchesProductVariants(mappings, ['M'], ['White']), false);
});

test('creates a new product code from its unique product id instead of product count', async () => {
  const first = createProductCode();
  const second = createProductCode();
  assert.match(first, /^TS-[A-F0-9]{24}$/);
  assert.notEqual(first, second);

  const originalCreate = Product.create;
  const originalCountDocuments = Product.countDocuments;
  let created;
  Product.create = async (value) => {
    created = value;
    return value;
  };
  Product.countDocuments = async () => {
    throw new Error('Product count must not be used to generate identifiers');
  };
  const response = {
    statusCode: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(value) {
      this.body = value;
      return this;
    }
  };

  try {
    await createProduct({ body: { name: 'DryFit Tee', price: 400, imageUrl: '/detail.jpg', thumbnailUrl: '/thumb.jpg' } }, response);
    assert.equal(response.statusCode, 201);
    assert.equal(created.productCode, `TS-${String(created._id).toUpperCase()}`);
    assert.equal(created.status, 'PENDING');
    assert.equal(created.imageUrl, '/detail.jpg');
    assert.equal(created.thumbnailUrl, '/thumb.jpg');
  } finally {
    Product.create = originalCreate;
    Product.countDocuments = originalCountDocuments;
  }
});

test('updates the thumbnail without changing the product preview', async () => {
  const original = Product.findByIdAndUpdate;
  let updates;
  Product.findByIdAndUpdate = async (id, value) => {
    updates = value;
    return { _id: id, imageUrl: '/detail.jpg', ...value };
  };
  const response = { json(value) { this.body = value; return this; } };
  try {
    await updateProduct({ params: { id: 'product-id' }, body: { thumbnailUrl: '/thumb.jpg' } }, response);
    assert.equal(updates.thumbnailUrl, '/thumb.jpg');
    assert.equal(updates.imageUrl, undefined);
    assert.equal(response.body.imageUrl, '/detail.jpg');
  } finally {
    Product.findByIdAndUpdate = original;
  }
});

test('duplicate product identifier errors return an actionable conflict response', async () => {
  const originalCreate = Product.create;
  Product.create = async () => {
    const error = new Error('Duplicate key');
    error.code = 11000;
    throw error;
  };
  const response = {
    statusCode: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(value) {
      this.body = value;
      return this;
    }
  };

  try {
    await createProduct({ body: { name: 'DryFit Tee', price: 400 } }, response);
    assert.equal(response.statusCode, 409);
    assert.match(response.body.error, /Please try again/);
  } finally {
    Product.create = originalCreate;
  }
});

test('admin product listing includes pending products and preserves their Qikink mapping', async () => {
  const originalFind = Product.find;
  const pendingProduct = {
    _id: 'product-id',
    name: 'DryFit Tee',
    status: 'PENDING',
    qikinkVariants: [{ size: 'XS', colour: 'White', sku: 'verified-sku', printTypeId: 1 }]
  };
  Product.find = () => ({
    sort: () => ({
      lean: async () => [pendingProduct]
    })
  });
  const response = {
    statusCode: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(value) {
      this.body = value;
      return this;
    }
  };

  try {
    await listAllProductsAdmin({}, response);
    assert.equal(response.body.length, 1);
    assert.equal(response.body[0].status, 'PENDING');
    assert.equal(response.body[0].qikinkVariants[0].sku, 'verified-sku');
  } finally {
    Product.find = originalFind;
  }
});
