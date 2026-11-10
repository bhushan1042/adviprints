const INTERNAL_FIELD = /^(qikink|fulfilment|fulfillment)/i;

const toPublicProduct = (product) => {
  const value = typeof product?.toObject === 'function' ? product.toObject() : product;
  if (!value || typeof value !== 'object') return value;
  const publicProduct = Object.fromEntries(
    Object.entries(value).filter(([key]) => !INTERNAL_FIELD.test(key))
  );
  if (Array.isArray(value.qikinkVariants)) {
    const excluded = value.qikinkExcludedVariants || [];
    publicProduct.availableVariations = value.qikinkVariants.filter((variant) => !excluded.some((item) =>
      String(item.size).trim().toLowerCase() === String(variant.size).trim().toLowerCase() &&
      String(item.colour).split('|')[0].trim().toLowerCase() === String(variant.colour).split('|')[0].trim().toLowerCase()
    )).map(({ size, colour }) => ({ size, colour }));
  }
  return publicProduct;
};

module.exports = { toPublicProduct };
