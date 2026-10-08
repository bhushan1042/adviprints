import { mapProduct } from './catalog';

jest.mock('axios', () => {
  const apiClient = {
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() }
    }
  };

  return {
    __esModule: true,
    default: {
      create: jest.fn(() => apiClient),
      isCancel: jest.fn(() => false)
    }
  };
});

describe('mapProduct', () => {
  test('maps saved colour names and hex values for display and shirt previews', () => {
    const product = mapProduct({
      _id: 'shirt-1',
      name: 'Custom T-shirt',
      colours: ['Black', 'Navy Blue | #0B1F3A'],
      sizes: ['S', 'M', 'L']
    });

    expect(product.colors).toEqual([
      { name: 'Black', hex: 'Black' },
      { name: 'Navy Blue', hex: '#0B1F3A' }
    ]);
    expect(product.sizes).toEqual(['S', 'M', 'L']);
  });
});
