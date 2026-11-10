import fs from 'fs';
import path from 'path';

const source = fs.readFileSync(path.resolve(process.cwd(), '..', 'backend', 'views', 'admin.ejs'), 'utf8');
const start = source.indexOf('    function mountVariantTable(initialVariants, initialExcluded = []){');
const end = source.indexOf('    function readProductForm(){', start);
const makeTable = new Function('PRINT_TYPE_OPTIONS', 'csvList', 'escapeHtml', `${source.slice(start, end)}; return mountVariantTable;`);
const mountVariantTable = makeTable(
  [1, 2],
  (value) => [...new Set(String(value || '').split(',').map((item) => item.trim()).filter(Boolean))],
  (value) => String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
);

beforeEach(() => {
  document.body.innerHTML = '<input id="p_sizes" value="M"><input id="p_new_size"><button id="p_add_size"></button><div id="p_size_message"></div><input id="p_colours" value="Black"><div id="p_variants"></div>';
});

test('shows existing Qikink price, preserves edits when options change, and includes it in payload', () => {
  const collect = mountVariantTable([{ size: 'M', colour: 'Black', sku: 'sku-1', printTypeId: 1, productSku: 'product-1', designSku: 'design-1', qikinkPrice: 105.5 }]);
  const input = document.querySelector('.v_price');
  expect(input.value).toBe('105.5');
  input.value = '120.25';
  document.getElementById('p_sizes').value = 'M, L';
  document.getElementById('p_sizes').dispatchEvent(new Event('input'));
  expect(document.querySelector('.v_price').value).toBe('120.25');
  expect(collect()).toEqual([{ size: 'M', colour: 'Black', sku: 'sku-1', printTypeId: 1, productSku: 'product-1', designSku: 'design-1', qikinkPrice: 120.25 }]);
});

test('allows missing draft price but reports invalid price and incomplete rows', () => {
  const collect = mountVariantTable([{ size: 'M', colour: 'Black', sku: 'sku-1', printTypeId: 1 }]);
  expect(collect()).toEqual([{ size: 'M', colour: 'Black', sku: 'sku-1', printTypeId: 1 }]);
  document.querySelector('.v_price').value = '-1';
  expect(collect).toThrow(/valid Qikink price/);
  document.querySelector('.v_price').value = '100';
  document.querySelector('.v_sku').value = '';
  expect(collect).toThrow(/Store SKU/);
});

test('new mappings save separate SKU fields without inventing a print type', () => {
  const collect = mountVariantTable([]);
  document.querySelector('.v_sku').value = 'store-1';
  document.querySelector('.v_product_sku').value = 'product-1';
  document.querySelector('.v_design_sku').value = 'design-1';
  document.querySelector('.v_price').value = '305.48';
  expect(collect()).toEqual([{ size: 'M', colour: 'Black', sku: 'store-1', productSku: 'product-1', designSku: 'design-1', qikinkPrice: 305.48 }]);
});

test('generates five rows after entering five sizes and one colour', () => {
  document.getElementById('p_sizes').value = '';
  document.getElementById('p_colours').value = '';
  mountVariantTable([]);
  expect(document.getElementById('p_variants').textContent).toMatch(/no rows yet/i);
  document.getElementById('p_sizes').value = 'S, M, L, XL, XXL';
  document.getElementById('p_sizes').dispatchEvent(new Event('input'));
  expect(document.querySelectorAll('tr[data-key]')).toHaveLength(0);
  document.getElementById('p_colours').value = 'White';
  document.getElementById('p_colours').dispatchEvent(new Event('input'));
  expect(document.querySelectorAll('tr[data-key]')).toHaveLength(5);
  expect(document.querySelector('[aria-label="Store SKU for White XXL"]')).not.toBeNull();
});

test('preserves mappings for colours with display hex values', () => {
  document.getElementById('p_colours').value = 'Black | #000000';
  const collect = mountVariantTable([{ size: 'M', colour: 'Black', sku: 'sku-1', qikinkPrice: 100 }]);
  expect(document.querySelector('[aria-label="Store SKU for Black M"]').value).toBe('sku-1');
  expect(collect()).toEqual([{ size: 'M', colour: 'Black', sku: 'sku-1', qikinkPrice: 100 }]);
});

test('adding sizes preserves existing rows and their entered SKU details', () => {
  document.getElementById('p_sizes').value = 'S';
  document.getElementById('p_colours').value = 'White';
  const collect = mountVariantTable([]);
  document.querySelector('[aria-label="Store SKU for White S"]').value = 'store-s';
  document.querySelector('[aria-label="Product cost for White S"]').value = '305.48';
  const entry = document.getElementById('p_new_size');
  for (const size of ['M', 'L', 'XL', 'XXL']) {
    entry.value = size;
    document.getElementById('p_add_size').click();
  }
  expect(document.getElementById('p_sizes').value).toBe('S, M, L, XL, XXL');
  expect(document.querySelectorAll('tr[data-key]')).toHaveLength(5);
  expect(collect()).toEqual([{ size: 'S', colour: 'White', sku: 'store-s', qikinkPrice: 305.48 }]);
  entry.value = 's';
  document.getElementById('p_add_size').click();
  expect(document.getElementById('p_size_message').textContent).toMatch(/already/i);
  expect(document.querySelectorAll('tr[data-key]')).toHaveLength(5);
});

test('removes and restores only the selected variation and preserves its draft', () => {
  document.getElementById('p_sizes').value = 'S, M';
  document.getElementById('p_colours').value = 'White, Black';
  const collect = mountVariantTable([]);
  document.querySelector('[aria-label="Store SKU for White S"]').value = 'sku-s';
  document.querySelector('[aria-label="Remove White S"]').click();
  expect(document.querySelectorAll('tr[data-key]')).toHaveLength(3);
  expect(collect.excluded()).toEqual([{ size: 'S', colour: 'White' }]);
  expect(document.querySelector('[aria-label="Store SKU for Black S"]')).not.toBeNull();
  document.querySelector('.v_restore').click();
  expect(document.querySelector('[aria-label="Store SKU for White S"]').value).toBe('sku-s');
  expect(collect.excluded()).toEqual([]);
});
