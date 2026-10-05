const storage = require('../services/storage');

const maskEmail = (email) => {
  const [user = '', domain = ''] = String(email || '').split('@');
  if (!domain) return '';
  return `${user.slice(0, 1)}${'*'.repeat(Math.max(user.length - 1, 2))}@${domain}`;
};

const maskPhone = (phone) => {
  const digits = String(phone || '');
  if (digits.length <= 4) return digits ? '*'.repeat(digits.length) : '';
  return `${'*'.repeat(digits.length - 4)}${digits.slice(-4)}`;
};

// Customer-facing order view: no full contact details, no street address, no storage references.
const toPublicOrder = (order) => {
  const o = typeof order.toObject === 'function' ? order.toObject() : order;
  const address = o.address || {};
  return {
    _id: o._id,
    status: o.status,
    createdAt: o.createdAt,
    customerName: o.customerName,
    customerEmail: maskEmail(o.customerEmail),
    customerPhone: maskPhone(o.customerPhone),
    address: { city: address.city, state: address.state, country: address.country },
    productName: o.productName,
    productPrice: o.productPrice,
    size: o.size,
    colour: o.colour,
    quantity: o.quantity,
    totalPrice: o.totalPrice,
    designTemplate: o.designTemplate,
    position: o.position,
    paymentMethod: o.paymentMethod,
    // Signed link to the customer's own design; empty when unavailable (e.g. legacy or local storage).
    originalImagePath: storage.signedPrivateUrl(o.originalImagePath) || ''
  };
};

module.exports = { toPublicOrder, maskEmail, maskPhone };
