const test = require('node:test');
const assert = require('node:assert/strict');
const { createOrderNumber, createQikinkPayload } = require('../services/qikinkOrderService');
const { validateQikinkOrder } = require('../services/qikinkClient');

test('creates a Qikink-compliant unique order reference', () => {
  const reference = createOrderNumber();
  assert.match(reference, /^[a-z0-9_]{1,15}$/);
  assert.equal(reference.length, 15);
});

test('builds My Products order items without design or undocumented line-item fields', () => {
  const payload = createQikinkPayload({
    customerName: 'Ada Lovelace',
    customerEmail: 'ada@example.com',
    customerPhone: '9876543210',
    address: { street: '1 Example Road', city: 'Pune', state: 'Maharashtra', zipCode: '411001' },
    totalPrice: 1598,
    paymentMethod: 'cod',
    qikinkFulfillment: { reference: 'ap0123456789abc' },
    lineItems: [
      { qikinkSku: 'verified-sku-1', quantity: 1, qikinkPrice: 105 },
      { qikinkSku: 'verified-sku-2', quantity: 1, qikinkPrice: 105 }
    ]
  });

  assert.deepEqual(payload.line_items, [
    { search_from_my_products: 1, sku: 'verified-sku-1', quantity: '1', price: '105.00' },
    { search_from_my_products: 1, sku: 'verified-sku-2', quantity: '1', price: '105.00' }
  ]);
  assert.deepEqual(validateQikinkOrder(payload), []);
  assert.equal(payload.order_number, 'ap0123456789abc');
  assert.equal(payload.gateway, 'COD');
  assert.equal(payload.qikink_shipping, 1);
  assert.equal(payload.shipping_address.country_code, 'IN');
  assert.equal(payload.shipping_address.zip, '411001');
});

test('preserves leading zeros in PIN codes in the Qikink payload', () => {
  const payload = createQikinkPayload({
    customerName: 'Ada Lovelace',
    customerEmail: 'ada@example.com',
    customerPhone: '9876543210',
    address: { street: '1 Example Road', city: 'Pune', state: 'Maharashtra', zipCode: '012345' },
    totalPrice: 799,
    paymentMethod: 'cod',
    qikinkFulfillment: { reference: 'ap0123456789abc' },
    lineItems: [{ qikinkSku: 'verified-sku', quantity: 1 }]
  });

  assert.equal(payload.shipping_address.zip, '012345');
  assert.equal(typeof payload.shipping_address.zip, 'string');
});
