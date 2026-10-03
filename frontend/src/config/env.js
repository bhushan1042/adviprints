const DEFAULT_DEV_API_BASE = 'http://localhost:5000';

export const normalizeApiBase = (value) => value.replace(/\/+$/, '');

const rawApiBase = typeof process.env.REACT_APP_API_BASE === 'string'
  ? process.env.REACT_APP_API_BASE.trim()
  : '';

if (process.env.NODE_ENV === 'production' && !rawApiBase) {
  throw new Error(
    'REACT_APP_API_BASE is required for production builds. Set it to the public backend URL without a trailing slash.'
  );
}

export const API_BASE = normalizeApiBase(rawApiBase || DEFAULT_DEV_API_BASE);

export default API_BASE;
