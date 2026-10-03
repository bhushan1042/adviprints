const originalNodeEnv = process.env.NODE_ENV;
const originalApiBase = process.env.REACT_APP_API_BASE;

afterEach(() => {
  jest.resetModules();
  process.env.NODE_ENV = originalNodeEnv;

  if (typeof originalApiBase === 'undefined') {
    delete process.env.REACT_APP_API_BASE;
  } else {
    process.env.REACT_APP_API_BASE = originalApiBase;
  }
});

test('falls back to localhost in development when api base is missing', () => {
  process.env.NODE_ENV = 'development';
  delete process.env.REACT_APP_API_BASE;

  const env = require('./env');
  expect(env.API_BASE).toBe('http://localhost:5000');
});

test('throws in production when api base is missing', () => {
  process.env.NODE_ENV = 'production';
  delete process.env.REACT_APP_API_BASE;

  expect(() => require('./env')).toThrow(
    'REACT_APP_API_BASE is required for production builds'
  );
});
