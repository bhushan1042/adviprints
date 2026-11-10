// Colours are stored as "Name" or "Name | #hex"; variants and customers refer to the name.
const colourName = (value) => {
  const raw = String(value || '');
  const separator = raw.indexOf('|');
  return (separator === -1 ? raw : raw.slice(0, separator)).trim();
};

const sameText = (a, b) => String(a || '').trim().toLowerCase() === String(b || '').trim().toLowerCase();

const findVariant = (product, size, colour) =>
  (product.qikinkVariants || []).find((variant) =>
    sameText(variant.size, size) && sameText(colourName(variant.colour), colourName(colour))
  ) || null;

// Returns the reasons why a product cannot be published; an empty list means it can be enabled.
const getApprovalProblems = (product) => {
  const problems = [];
  const sizes = product.sizes || [];
  const colours = product.colours || [];
  const variants = product.qikinkVariants || [];

  if (!product.name || !String(product.name).trim()) problems.push('Product title is required.');
  if (!Number.isFinite(Number(product.price)) || Number(product.price) <= 0) problems.push('A selling price greater than 0 is required.');
  if (!product.imageUrl) problems.push('At least one product image is required.');
  if (!sizes.length) problems.push('At least one size is required.');
  if (!colours.length) problems.push('At least one colour is required.');

  for (const colour of colours) {
    for (const size of sizes) {
      if (!findVariant(product, size, colour)) {
        problems.push(`Missing Qikink SKU for ${colourName(colour)} / ${size}.`);
      }
    }
  }
  for (const variant of variants) {
    if (!(Number(variant.qikinkPrice) > 0)) {
      problems.push(`SKU ${variant.sku} is missing a Qikink price.`);
    }
    const sizeKnown = sizes.some((size) => sameText(size, variant.size));
    const colourKnown = colours.some((colour) => sameText(colourName(colour), colourName(variant.colour)));
    if (!sizeKnown || !colourKnown) {
      problems.push(`SKU ${variant.sku} maps to ${variant.colour} / ${variant.size}, which is not a configured colour and size.`);
    }
  }
  return problems;
};

module.exports = { colourName, sameText, findVariant, getApprovalProblems };
