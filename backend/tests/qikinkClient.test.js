const test = require('node:test');
const assert = require('node:assert/strict');
const { QikinkClient, QikinkError, validateQikinkOrder } = require('../services/qikinkClient');

const validOrder = () => ({
  order_number: 'ap_0123456789ab',
  qikink_shipping: 1,
  gateway: 'COD',
  total_order_value: 799,
  shipping_address: {
    first_name: 'Test',
    last_name: 'Customer',
    address1: '12 Example Street',
    phone: '9876543210',
    email: 'test@example.com',
    city: 'Pune',
    zip: 411001,
    province: 'Maharashtra',
    country_code: 'IN'
  },
  line_items: [{
    search_from_my_products: 0,
    print_type_id: 1,
    quantity: 1,
    price: 799,
    sku: 'verified-sku',
    designs: [{
      design_code: 'ap_design_01',
      width_inches: 10,
      height_inches: 12,
      design_link: 'https://assets.example.com/design.png',
      mockup_link: 'https://assets.example.com/mockup.png',
      placement_sku: 'fr'
    }]
  }]
});

const response = (data, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => data
});

test('accepts a documented new-design payload', () => {
  assert.deepEqual(validateQikinkOrder(validOrder()), []);
});

test('rejects invalid reference, unexpected fields, unsupported print type, and excess quantity', () => {
  const order = validOrder();
  order.order_number = 'UPPER-case';
  order.unexpected = true;
  order.line_items[0].print_type_id = 4;
  order.line_items[0].quantity = 101;
  const errors = validateQikinkOrder(order);
  assert.ok(errors.some((error) => error.startsWith('order_number:')));
  assert.ok(errors.some((error) => error.startsWith('unexpected:')));
  assert.ok(errors.some((error) => error.includes('print_type_id:')));
  assert.ok(errors.some((error) => error.includes('quantity:')));
});

test('validates shipping and documented print dimensions', () => {
  const order = validOrder();
  order.shipping_address.address1 = 'x'.repeat(91);
  order.line_items[0].designs[0].width_inches = 17;
  const errors = validateQikinkOrder(order);
  assert.ok(errors.some((error) => error.includes('address1:')));
  assert.ok(errors.some((error) => error.includes('width_inches:')));
});

test('allows the documented plain-product line item without artwork', () => {
  const order = validOrder();
  order.line_items[0] = {
    search_from_my_products: 0,
    print_type_id: 1,
    quantity: 1,
    price: 799,
    sku: 'verified-plain-sku'
  };
  assert.deepEqual(validateQikinkOrder(order), []);
});

test('accepts My Products line items without design or print_type_id', () => {
  const order = validOrder();
  order.line_items[0] = {
    search_from_my_products: 1,
    quantity: 2,
    sku: 'verified-own-product-sku'
  };
  assert.deepEqual(validateQikinkOrder(order), []);
});

test('rejects unnecessary designs in My Products mode', () => {
  const order = validOrder();
  order.line_items[0] = {
    search_from_my_products: 1,
    quantity: 1,
    sku: 'verified-own-product-sku',
    designs: []
  };
  assert.ok(validateQikinkOrder(order).some((error) => error.includes('design details are not needed')));
});

test('does not make the example-only line-item price mandatory', () => {
  const order = validOrder();
  delete order.line_items[0].price;
  assert.deepEqual(validateQikinkOrder(order), []);
});

test('concurrent token requests share one token acquisition', async () => {
  let calls = 0;
  const client = new QikinkClient({
    config: { environment: 'sandbox', clientId: 'id', clientSecret: 'secret', liveEnabled: false },
    fetchImpl: async (url) => {
      calls += 1;
      assert.equal(url, 'https://sandbox.qikink.com/api/token');
      await new Promise((resolve) => setTimeout(resolve, 5));
      return response({ Accesstoken: 'token-value', expires_in: 3600 });
    }
  });
  const tokens = await Promise.all([client.getToken(), client.getToken(), client.getToken()]);
  assert.deepEqual(tokens, ['token-value', 'token-value', 'token-value']);
  assert.equal(calls, 1);
});

test('authenticates against the Sandbox token endpoint using URL-encoded credentials', async () => {
  let captured;
  const client = new QikinkClient({
    config: {
      environment: 'sandbox',
      baseUrl: 'https://sandbox.qikink.com',
      clientId: 'sandbox id',
      clientSecret: 'sandbox&secret',
      liveEnabled: false
    },
    fetchImpl: async (url, options) => {
      captured = { url, options };
      return response({ Accesstoken: 'test-token', expires_in: 3600 });
    }
  });

  assert.equal(await client.getToken(), 'test-token');
  assert.equal(captured.url, 'https://sandbox.qikink.com/api/token');
  assert.equal(captured.options.method, 'POST');
  assert.equal(captured.options.headers['Content-Type'], 'application/x-www-form-urlencoded');
  assert.deepEqual(
    Object.fromEntries(new URLSearchParams(captured.options.body)),
    { ClientId: 'sandbox id', client_secret: 'sandbox&secret' }
  );
});

test('missing Qikink credentials fail before making an HTTP request', async () => {
  let calls = 0;
  const client = new QikinkClient({
    config: { environment: 'sandbox', baseUrl: 'https://sandbox.qikink.com', clientId: '', clientSecret: '', liveEnabled: false },
    fetchImpl: async () => {
      calls += 1;
      return response({ Accesstoken: 'unexpected', expires_in: 3600 });
    }
  });

  await assert.rejects(client.getToken(), (error) => {
    assert.equal(error.code, 'NOT_CONFIGURED');
    assert.match(error.message, /credentials are not configured on the backend/);
    return true;
  });
  assert.equal(calls, 0);
});

test('refreshes a token before its reported expiry', async () => {
  let now = 0;
  let calls = 0;
  const client = new QikinkClient({
    config: { environment: 'sandbox', clientId: 'id', clientSecret: 'secret', liveEnabled: false },
    now: () => now,
    fetchImpl: async () => {
      calls += 1;
      return response({ Accesstoken: `token-${calls}`, expires_in: 60 });
    }
  });
  assert.equal(await client.getToken(), 'token-1');
  now = 31_000;
  assert.equal(await client.getToken(), 'token-2');
  assert.equal(calls, 2);
});

test('normalizes authentication failures without exposing response bodies', async () => {
  const client = new QikinkClient({
    config: { environment: 'sandbox', clientId: 'id', clientSecret: 'secret', liveEnabled: false },
    fetchImpl: async () => response({ error: 'private upstream detail' }, 401)
  });
  await assert.rejects(client.getToken(), (error) => {
    assert.equal(error.code, 'API_REJECTED');
    assert.equal(error.status, 401);
    assert.equal(error.message.includes('private upstream detail'), false);
    return true;
  });
});

test('keeps calls within the documented 60 requests per minute limit', async () => {
  let now = 0;
  let waits = 0;
  let calls = 0;
  const client = new QikinkClient({
    config: { environment: 'sandbox', clientId: 'id', clientSecret: 'secret', liveEnabled: false },
    now: () => now,
    sleep: async (ms) => {
      waits += 1;
      now += ms;
    },
    fetchImpl: async () => {
      calls += 1;
      return response({});
    }
  });
  await Promise.all(Array.from({ length: 61 }, () => client.request('/test')));
  assert.equal(calls, 61);
  assert.equal(waits, 1);
});

test('submits a validated order with backend credentials and exact API headers', async () => {
  const requests = [];
  const client = new QikinkClient({
    config: { environment: 'sandbox', clientId: 'id', clientSecret: 'secret', liveEnabled: false },
    fetchImpl: async (url, options) => {
      requests.push({ url, options });
      return requests.length === 1
        ? response({ Accesstoken: 'token-value', expires_in: 3600 })
        : response({ message: 'Order created successfully', order_id: 42, status_code: '200' });
    }
  });
  const result = await client.createOrder(validOrder());
  assert.equal(result.order_id, 42);
  assert.equal(requests[1].url, 'https://sandbox.qikink.com/api/order/create');
  assert.equal(requests[1].options.headers.ClientId, 'id');
  assert.equal(requests[1].options.headers.Accesstoken, 'token-value');
  assert.deepEqual(JSON.parse(requests[1].options.body), validOrder());
});

test('does not silently retry a timed-out order creation', async () => {
  let calls = 0;
  const client = new QikinkClient({
    config: { environment: 'sandbox', clientId: 'id', clientSecret: 'secret', liveEnabled: false },
    fetchImpl: async () => {
      calls += 1;
      return calls === 1
        ? response({ Accesstoken: 'token-value', expires_in: 3600 })
        : Promise.reject(new Error('timeout'));
    }
  });
  await assert.rejects(client.createOrder(validOrder()), (error) => {
    assert.ok(error instanceof QikinkError);
    assert.equal(error.code, 'NETWORK_ERROR');
    assert.equal(error.outcomeUnknown, true);
    return true;
  });
  assert.equal(calls, 2);
});

test('blocks Live order creation even when the Live environment flag is enabled', async () => {
  let calls = 0;
  const client = new QikinkClient({
    config: { environment: 'live', clientId: 'id', clientSecret: 'secret', liveEnabled: true },
    fetchImpl: async () => {
      calls += 1;
      return response({});
    }
  });
  await assert.rejects(client.createOrder(validOrder()), { code: 'LIVE_DISABLED' });
  assert.equal(calls, 0);
});

test('documents sandbox order-list limitation without making a network request', async () => {
  let calls = 0;
  const client = new QikinkClient({
    config: { environment: 'sandbox', clientId: 'id', clientSecret: 'secret', liveEnabled: false },
    fetchImpl: async () => {
      calls += 1;
      return response({});
    }
  });
  await assert.rejects(client.listOrders(), { code: 'SANDBOX_LIST_UNAVAILABLE' });
  assert.equal(calls, 0);
});
