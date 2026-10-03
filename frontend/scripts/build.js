process.env.BABEL_ENV = 'production';
process.env.NODE_ENV = 'production';

require('react-scripts/config/env');

const rawApiBase = typeof process.env.REACT_APP_API_BASE === 'string'
  ? process.env.REACT_APP_API_BASE.trim()
  : '';

if (!rawApiBase) {
  throw new Error(
    'REACT_APP_API_BASE is required for production builds. Set it to the public backend URL without a trailing slash.'
  );
}

require('react-scripts/scripts/build');
