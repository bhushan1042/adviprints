const test = require('node:test');
const assert = require('node:assert/strict');
const Order = require('../models/Order');
const Product = require('../models/Product');
const { createOrder, isValidIndianPinCode } = require('../controllers/orderController');
const { toPublicProduct } = require('../utils/publicProductView');

test('public product view removes Qikink and fulfilment fields', () => {
  const view = toPublicProduct({
    _id: 'product-id',
    name: 'Ready tee',
    qikinkVariants: [{ size: 'M', colour: 'Black', sku: 'internal-sku', printTypeId: 1 }],
    qikinkSku: 'internal-sku',
    qikinkPrintTypeId: 1,
    qikinkFulfillment: { account: 'internal' },
    fulfillment: { config: 'internal' }
  });

  assert.deepEqual(view, { _id: 'product-id', name: 'Ready tee', availableVariations: [{ size: 'M', colour: 'Black' }] });
  assert.equal(JSON.stringify(view).includes('internal-sku'), false);
});

test('public availability excludes removed combinations without exposing SKU data', () => {
  const view = toPublicProduct({
    qikinkVariants: [
      { size: 'S', colour: 'White', sku: 'private-s' },
      { size: 'M', colour: 'White', sku: 'private-m' }
    ],
    qikinkExcludedVariants: [{ size: 'S', colour: 'White' }]
  });
  assert.deepEqual(view, { availableVariations: [{ size: 'M', colour: 'White' }] });
});

test('checkoutId has a declared unique sparse MongoDB index', () => {
  const checkoutIndex = Order.schema.indexes().find(([keys]) => keys.checkoutId === 1);
  assert.ok(checkoutIndex, 'checkoutId index should be declared in the Order schema');
  assert.equal(checkoutIndex[1].unique, true);
  assert.equal(checkoutIndex[1].sparse, true);
});

test('Qikink order references have a declared unique sparse MongoDB index', () => {
  const referenceIndex = Order.schema.indexes().find(
    ([keys]) => keys['qikinkFulfillment.reference'] === 1
  );
  assert.ok(referenceIndex, 'Qikink reference index should be declared in the Order schema');
  assert.equal(referenceIndex[1].unique, true);
  assert.equal(referenceIndex[1].sparse, true);
});

test('duplicate-key checkout race returns the already-created order without resubmitting', async () => {
  const originalFindOne = Order.findOne;
  const originalCreate = Order.create;
  const originalProductFind = Product.find;
  const existingOrder = { _id: 'existing-order', status: 'pending' };
  let lookupCount = 0;
  Order.findOne = async () => {
    lookupCount += 1;
    return lookupCount === 1 ? null : existingOrder;
  };
  Order.create = async () => {
    const error = new Error('Duplicate checkoutId');
    error.code = 11000;
    throw error;
  };
  Product.find = () => ({
    lean: async () => [{
      _id: '507f1f77bcf86cd799439011',
      status: 'ENABLED',
      price: 799,
      sizes: ['M'],
      colours: ['Black'],
      qikinkVariants: [{ size: 'M', colour: 'Black', sku: 'verified-sku', printTypeId: 1, qikinkPrice: 105 }]
    }]
  });

  const response = {
    statusCode: 200,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    }
  };

  try {
    await createOrder({
      body: {
        checkoutId: 'checkout_123456',
        customerName: 'Asha Rao',
        customerEmail: 'asha@example.test',
        customerPhone: '9000000000',
        address: {
          street: '12 Example Road',
          city: 'Pune',
          state: 'Maharashtra',
          zipCode: '012345',
          country: 'India'
        },
        items: [{
          productId: '507f1f77bcf86cd799439011',
          size: 'M',
          colour: 'Black',
          quantity: 1
        }],
        paymentMethod: 'cod'
      }
    }, response, (error) => {
      throw error;
    });

    assert.equal(response.statusCode, 200);
    assert.equal(response.body.orderId, 'existing-order');
    assert.equal(response.body.message, 'This checkout was already submitted.');
    assert.equal(lookupCount, 2);
  } finally {
    Order.findOne = originalFindOne;
    Order.create = originalCreate;
    Product.find = originalProductFind;
  }
});

test('PIN validation preserves six digits including leading zeros', () => {
  assert.equal(isValidIndianPinCode('012345'), true);
  assert.equal(isValidIndianPinCode('411001'), true);
  assert.equal(isValidIndianPinCode('12345'), false);
  assert.equal(isValidIndianPinCode('1234567'), false);
  assert.equal(isValidIndianPinCode('12A456'), false);
  assert.equal(isValidIndianPinCode(123456), false);
});
