const INTERNAL_FIELD = /^(qikink|fulfilment|fulfillment)/i;

const toPublicProduct = (product) => {
  const value = typeof product?.toObject === 'function' ? product.toObject() : product;
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.entries(value).filter(([key]) => !INTERNAL_FIELD.test(key))
  );
};

module.exports = { toPublicProduct };
