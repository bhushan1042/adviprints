const test = require('node:test');
const assert = require('node:assert/strict');
const { findVariant, getApprovalProblems } = require('../utils/productVariants');

const readyProduct = () => ({
  name: 'Ready tee',
  price: 799,
  imageUrl: 'https://images.example.com/tee.png',
  sizes: ['S', 'M'],
  colours: ['Black | #000000', 'White | #ffffff'],
  qikinkVariants: [
    { size: 'S', colour: 'Black', sku: 'verified-black-s', printTypeId: 1, qikinkPrice: 105 },
    { size: 'M', colour: 'Black', sku: 'verified-black-m', printTypeId: 1, qikinkPrice: 105 },
    { size: 'S', colour: 'White', sku: 'verified-white-s', printTypeId: 1, qikinkPrice: 105 },
    { size: 'M', colour: 'White', sku: 'verified-white-m', printTypeId: 1, qikinkPrice: 105 }
  ]
});

test('finds the exact SKU mapping independent of colour hex metadata and letter case', () => {
  const product = readyProduct();
  assert.equal(findVariant(product, 'm', 'black').sku, 'verified-black-m');
});

test('product can be enabled only when every configured combination has a SKU', () => {
  const product = readyProduct();
  assert.deepEqual(getApprovalProblems(product), []);
  product.qikinkVariants.pop();
  assert.ok(getApprovalProblems(product).some((problem) => problem.includes('White / M')));
});

test('product cannot be enabled until every SKU has a Qikink price', () => {
  const product = readyProduct();
  delete product.qikinkVariants[0].qikinkPrice;
  assert.ok(getApprovalProblems(product).some((problem) => problem.includes('verified-black-s') && problem.includes('price')));
});

test('explicitly removed combinations are not orderable and do not block approval', () => {
  const product = readyProduct();
  product.qikinkVariants.pop();
  product.qikinkExcludedVariants = [{ size: 'M', colour: 'White' }];
  assert.deepEqual(getApprovalProblems(product), []);
  assert.equal(findVariant(product, 'M', 'White'), null);
  assert.ok(findVariant(product, 'M', 'Black'));
  product.qikinkVariants = [];
  assert.ok(getApprovalProblems(product).some((problem) => problem.includes('At least one Qikink variation')));
});

test('invalid product information prevents approval', () => {
  const product = readyProduct();
  product.imageUrl = '';
  product.price = 0;
  assert.ok(getApprovalProblems(product).some((problem) => problem.includes('image')));
  assert.ok(getApprovalProblems(product).some((problem) => problem.includes('price')));
});
