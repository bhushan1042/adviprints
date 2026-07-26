const createSlug = (value) => {
  if (!value) return undefined;
  return value.toString().trim().toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9\-]/g, '')
    .replace(/\-+/g, '-')
    .replace(/^-+|-+$/g, '');
};

module.exports = { createSlug };
