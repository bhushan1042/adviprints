const originalNodeEnv = process.env.NODE_ENV;
const originalApiBase = process.env.REACT_APP_API_BASE;

beforeEach(() => {
  jest.resetModules();
  process.env.NODE_ENV = 'development';
  process.env.REACT_APP_API_BASE = 'https://api.example.com/';
});

afterAll(() => {
  process.env.NODE_ENV = originalNodeEnv;

  if (typeof originalApiBase === 'undefined') {
    delete process.env.REACT_APP_API_BASE;
  } else {
    process.env.REACT_APP_API_BASE = originalApiBase;
  }
});

test('prefixes relative upload paths with the configured api base', () => {
  const { resolveImageUrl } = require('./images');
  expect(resolveImageUrl('/uploads/file.png')).toBe('https://api.example.com/uploads/file.png');
});

test('preserves absolute urls and falls back for empty values', () => {
  const { resolveImageUrl } = require('./images');
  expect(resolveImageUrl('https://cdn.example.com/image.png', 'fallback')).toBe('https://cdn.example.com/image.png');
  expect(resolveImageUrl('', 'fallback')).toBe('fallback');
  expect(resolveImageUrl('blob:1234', 'fallback')).toBe('blob:1234');
});

test('keeps frontend public and bundled assets off the backend URL', () => {
  const { resolveImageUrl } = require('./images');
  expect(resolveImageUrl('/images/tshirt-template.jpg')).toBe('/images/tshirt-template.jpg');
  expect(resolveImageUrl('/assets/category-placeholder.png')).toBe('/assets/category-placeholder.png');
});
