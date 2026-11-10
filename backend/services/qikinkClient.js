const ALLOWED_PRINT_TYPES = new Set([1, 2, 3, 5, 6, 7, 12, 13, 14, 15, 17, 23]);
const PLACEMENTS = new Set(['fr', 'bk', 'lp', 'rp', 'rs', 'ls']);
const BASE_URLS = {
  sandbox: 'https://sandbox.qikink.com',
  live: 'https://api.qikink.com'
};
const MAX_REQUESTS_PER_WINDOW = 60;
const RATE_WINDOW_MS = 60_000;

class QikinkError extends Error {
  constructor(message, { code = 'QIKINK_ERROR', status = null, outcomeUnknown = false, detail = null } = {}) {
    super(message);
    this.name = 'QikinkError';
    this.code = code;
    this.status = status;
    this.outcomeUnknown = outcomeUnknown;
    this.detail = detail;
  }
}

const isValidUrl = (value) => {
  if (typeof value !== 'string' || value.length > 512) return false;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && Boolean(url.hostname);
  } catch (err) {
    return false;
  }
};

const validateQikinkOrder = (order) => {
  const errors = [];
  const allowedTopLevel = new Set(['order_number', 'qikink_shipping', 'gateway', 'total_order_value', 'line_items', 'shipping_address', 'add_ons']);
  const allowedLineItem = new Set(['search_from_my_products', 'print_type_id', 'quantity', 'price', 'sku', 'designs']);
  const allowedDesign = new Set(['design_code', 'width_inches', 'height_inches', 'design_link', 'mockup_link', 'placement_sku']);
  const allowedAddress = new Set(['first_name', 'last_name', 'address1', 'address2', 'phone', 'email', 'city', 'zip', 'province', 'country_code']);
  const addError = (path, message) => errors.push(`${path}: ${message}`);

  if (!order || typeof order !== 'object' || Array.isArray(order)) {
    return ['order: must be an object'];
  }
  Object.keys(order).filter((key) => !allowedTopLevel.has(key)).forEach((key) => addError(key, 'unexpected field'));
  if (typeof order.order_number !== 'string' || !/^[a-z0-9_]{1,15}$/.test(order.order_number)) {
    addError('order_number', 'must be 1-15 lowercase letters, digits or underscores');
  }
  if (typeof order.qikink_shipping !== 'number' || ![0, 1].includes(order.qikink_shipping)) {
    addError('qikink_shipping', 'must be numeric 0 or 1');
  }
  if (!['COD', 'Prepaid'].includes(order.gateway)) addError('gateway', 'must be COD or Prepaid');
  if (typeof order.total_order_value !== 'number' || !Number.isFinite(order.total_order_value) || order.total_order_value < 0) {
    addError('total_order_value', 'must be a non-negative number');
  }
  if (!Array.isArray(order.line_items) || order.line_items.length === 0) {
    addError('line_items', 'must be a non-empty array');
  } else {
    order.line_items.forEach((item, index) => {
      const path = `line_items[${index}]`;
      if (!item || typeof item !== 'object' || Array.isArray(item)) {
        addError(path, 'must be an object');
        return;
      }
      Object.keys(item).filter((key) => !allowedLineItem.has(key)).forEach((key) => addError(`${path}.${key}`, 'unexpected field'));
      if (typeof item.search_from_my_products !== 'number' || ![0, 1].includes(item.search_from_my_products)) {
        addError(`${path}.search_from_my_products`, 'must be numeric 0 or 1');
      }
      if (typeof item.sku !== 'string' || !item.sku.trim() || item.sku !== item.sku.trim() || item.sku.length > 50) {
        addError(`${path}.sku`, 'must be a trimmed non-empty string of at most 50 characters');
      }
      const quantityValue = typeof item.quantity === 'string' && /^\d+$/.test(item.quantity) ? Number(item.quantity) : item.quantity;
      if (typeof quantityValue !== 'number' || !Number.isInteger(quantityValue) || quantityValue < 1 || quantityValue > 100) {
        addError(`${path}.quantity`, 'must be an integer from 1 to 100');
      }
      if (item.search_from_my_products === 0 || item.print_type_id !== undefined) {
        if (typeof item.print_type_id !== 'number' || !ALLOWED_PRINT_TYPES.has(item.print_type_id)) {
          addError(`${path}.print_type_id`, 'is not a documented numeric print type');
        }
      }
      if (item.search_from_my_products === 1 && item.designs !== undefined) {
        addError(`${path}.designs`, 'design details are not needed when search_from_my_products is 1');
      }
      const priceValue = typeof item.price === 'string' && /^\d+(\.\d{1,2})?$/.test(item.price) ? Number(item.price) : item.price;
      if (item.price !== undefined && (typeof priceValue !== 'number' || !Number.isFinite(priceValue) || priceValue < 0)) {
        addError(`${path}.price`, 'must be a non-negative number when supplied');
      }
      const designs = item.designs;
      const hasDesign = Array.isArray(designs) && designs.length > 0;
      const canBePlainProduct = item.print_type_id === 1;
      if (item.search_from_my_products === 0 && !hasDesign && !canBePlainProduct) {
        addError(`${path}.designs`, 'is required for a printed product');
      }
      if (designs !== undefined && !Array.isArray(designs)) addError(`${path}.designs`, 'must be an array');
      if (Array.isArray(designs)) {
        designs.forEach((design, designIndex) => {
          const designPath = `${path}.designs[${designIndex}]`;
          if (!design || typeof design !== 'object' || Array.isArray(design)) {
            addError(designPath, 'must be an object');
            return;
          }
          Object.keys(design).filter((key) => !allowedDesign.has(key)).forEach((key) => addError(`${designPath}.${key}`, 'unexpected field'));
          if (typeof design.design_code !== 'string' || !design.design_code.trim() || design.design_code.length > 20) {
            addError(`${designPath}.design_code`, 'must be a non-empty string of at most 20 characters');
          }
          if (!PLACEMENTS.has(design.placement_sku)) addError(`${designPath}.placement_sku`, 'is not a documented placement');
          if (!isValidUrl(design.mockup_link)) addError(`${designPath}.mockup_link`, 'must be a valid HTTPS URL of at most 512 characters');
          if (!isValidUrl(design.design_link)) addError(`${designPath}.design_link`, 'must be a valid HTTPS URL of at most 512 characters');
          const width = Number(design.width_inches);
          const height = Number(design.height_inches);
          const printTypeId = item.print_type_id;
          const maxWidth = printTypeId === 17 ? 18 : 16;
          if (!Number.isFinite(width) || width <= 0 || ([1, 17].includes(printTypeId) && width > maxWidth)) {
            addError(`${designPath}.width_inches`, `must be greater than 0${[1, 17].includes(printTypeId) ? ` and at most ${maxWidth}` : ''}`);
          }
          if (!Number.isFinite(height) || height <= 0 || ([1, 17].includes(printTypeId) && height > 20)) {
            addError(`${designPath}.height_inches`, `must be greater than 0${[1, 17].includes(printTypeId) ? ' and at most 20' : ''}`);
          }
        });
      }
    });
  }
  if (Number(order.qikink_shipping) === 1) {
    const address = order.shipping_address;
    if (!address || typeof address !== 'object' || Array.isArray(address)) {
      addError('shipping_address', 'is required when Qikink handles shipping');
    } else {
      Object.keys(address).filter((key) => !allowedAddress.has(key)).forEach((key) => addError(`shipping_address.${key}`, 'unexpected field'));
      ['first_name', 'address1', 'phone', 'email', 'city', 'zip', 'province', 'country_code'].forEach((field) => {
        if (address[field] === undefined || String(address[field]).trim() === '') addError(`shipping_address.${field}`, 'is required');
      });
      if (typeof address.address1 === 'string' && address.address1.length > 90) addError('shipping_address.address1', 'must not exceed 90 characters');
    }
  }
  if (order.add_ons !== undefined) {
    if (!Array.isArray(order.add_ons) || order.add_ons.length > 1) {
      addError('add_ons', 'must be an array with at most one object');
    } else if (order.add_ons[0]) {
      const flags = order.add_ons[0];
      const allowedFlags = new Set(['box_packing', 'gift_wrap', 'rush_order', 'custom_letter']);
      Object.keys(flags).filter((key) => !allowedFlags.has(key)).forEach((key) => addError(`add_ons[0].${key}`, 'unexpected field'));
      ['box_packing', 'gift_wrap', 'rush_order'].forEach((key) => {
        if (flags[key] !== undefined && ![0, 1].includes(Number(flags[key]))) addError(`add_ons[0].${key}`, 'must be 0 or 1');
      });
      if (flags.custom_letter !== undefined && flags.custom_letter !== 0 && !isValidUrl(flags.custom_letter)) {
        addError('add_ons[0].custom_letter', 'must be 0 or a valid HTTPS URL');
      }
    }
  }
  return errors;
};

class QikinkClient {
  constructor({ config, fetchImpl = global.fetch, now = Date.now, sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)), timeoutMs = 15_000 }) {
    this.config = config;
    this.fetch = fetchImpl;
    this.now = now;
    this.sleep = sleep;
    this.timeoutMs = timeoutMs;
    this.token = null;
    this.tokenExpiry = 0;
    this.tokenPromise = null;
    this.requestTimes = [];
  }

  get baseUrl() {
    return this.config.baseUrl || BASE_URLS[this.config.environment];
  }

  assertConfigured({ allowLiveRead = false } = {}) {
    if (!this.baseUrl) throw new QikinkError('Qikink environment is invalid', { code: 'CONFIGURATION' });
    if (!this.config.clientId || !this.config.clientSecret) {
      throw new QikinkError('Qikink credentials are not configured on the backend', { code: 'NOT_CONFIGURED' });
    }
    if (this.config.environment === 'live' && !allowLiveRead) {
      throw new QikinkError('Qikink Live submission is disabled', { code: 'LIVE_DISABLED' });
    }
  }

  async reserveRateLimit() {
    const now = this.now();
    this.requestTimes = this.requestTimes.filter((time) => now - time < RATE_WINDOW_MS);
    if (this.requestTimes.length >= MAX_REQUESTS_PER_WINDOW) {
      const delay = Math.max(0, RATE_WINDOW_MS - (now - this.requestTimes[0]));
      await this.sleep(delay);
      return this.reserveRateLimit();
    }
    this.requestTimes.push(this.now());
  }

  async request(path, { method = 'GET', headers = {}, body } = {}) {
    await this.reserveRateLimit();
    let response;
    try {
      response = await this.fetch(`${this.baseUrl}${path}`, {
        method,
        headers,
        body,
        signal: AbortSignal.timeout(this.timeoutMs)
      });
    } catch (err) {
      throw new QikinkError('Qikink request failed or timed out', {
        code: 'NETWORK_ERROR',
        outcomeUnknown: method === 'POST' && path === '/api/order/create'
      });
    }
    let data;
    try {
      data = await response.json();
    } catch (err) {
      throw new QikinkError('Qikink returned an invalid response', {
        code: 'INVALID_RESPONSE',
        status: response.status,
        outcomeUnknown: method === 'POST' && response.ok
      });
    }
    if (!response.ok) {
      const rawDetail = data && (data.error || data.message);
      throw new QikinkError(
        response.status === 429 ? 'Qikink rate limit exceeded' : 'Qikink rejected the request',
        {
          code: response.status === 429 ? 'RATE_LIMITED' : 'API_REJECTED',
          status: response.status,
          detail: typeof rawDetail === 'string' ? rawDetail.slice(0, 200) : null,
          outcomeUnknown: method === 'POST' && path === '/api/order/create' && response.status >= 500
        }
      );
    }
    return data;
  }

  async getToken({ allowLiveRead = false } = {}) {
    this.assertConfigured({ allowLiveRead });
    if (this.token && this.now() < this.tokenExpiry - 30_000) return this.token;
    if (this.tokenPromise) return this.tokenPromise;
    this.tokenPromise = (async () => {
      const form = new URLSearchParams({
        ClientId: this.config.clientId,
        client_secret: this.config.clientSecret
      });
      const data = await this.request('/api/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: form.toString()
      });
      if (!data.Accesstoken || !Number.isFinite(Number(data.expires_in)) || Number(data.expires_in) <= 0) {
        throw new QikinkError('Qikink token response is missing required fields', { code: 'INVALID_TOKEN_RESPONSE' });
      }
      this.token = data.Accesstoken;
      this.tokenExpiry = this.now() + Number(data.expires_in) * 1000;
      return this.token;
    })();
    try {
      return await this.tokenPromise;
    } finally {
      this.tokenPromise = null;
    }
  }

  async createOrder(order) {
    this.assertConfigured();
    const errors = validateQikinkOrder(order);
    if (errors.length) throw new QikinkError(`Invalid Qikink order payload: ${errors.join('; ')}`, { code: 'INVALID_PAYLOAD' });
    const token = await this.getToken();
    return this.request('/api/order/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ClientId: this.config.clientId,
        Accesstoken: token
      },
      body: JSON.stringify(order)
    });
  }

  async listOrders(params = {}) {
    if (this.config.environment === 'sandbox') {
      throw new QikinkError('Qikink order-list retrieval is documented as unavailable in Sandbox', { code: 'SANDBOX_LIST_UNAVAILABLE' });
    }
    this.assertConfigured({ allowLiveRead: true });
    const allowed = new Set(['order_reference_no', 'status', 'live_date_min', 'live_date_max', 'page_no']);
    for (const key of Object.keys(params)) {
      if (!allowed.has(key)) throw new QikinkError(`Unsupported Qikink order-list parameter: ${key}`, { code: 'INVALID_PARAMETER' });
    }
    const query = new URLSearchParams(params);
    const token = await this.getToken({ allowLiveRead: true });
    const queryString = query.toString();
    return this.request(`/api/order/list${queryString ? `?${queryString}` : ''}`, {
      headers: { ClientId: this.config.clientId, Accesstoken: token }
    });
  }
}

let defaultClient;
const getQikinkClient = () => {
  if (!defaultClient) {
    const { getConfig } = require('../config/env');
    defaultClient = new QikinkClient({ config: getConfig().qikink });
  }
  return defaultClient;
};

module.exports = { QikinkClient, QikinkError, validateQikinkOrder, getQikinkClient, ALLOWED_PRINT_TYPES };
