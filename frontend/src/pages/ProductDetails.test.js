import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ProductDetails from './ProductDetails';

const mockProduct = {
  id: 'p1', name: 'Example', slug: 'p1', price: 500, category: 'shirts',
  categoryName: 'Shirts', images: ['/image.jpg'], colors: [{ name: 'White', hex: '#fff' }, { name: 'Black', hex: '#000' }],
  sizes: ['S', 'M'], availableVariations: [{ size: 'M', colour: 'White' }, { size: 'S', colour: 'Black' }, { size: 'M', colour: 'Black' }],
  rating: 0, reviewCount: 0, features: [], description: ''
};
const mockCategories = [];
jest.mock('react-router-dom', () => ({
  Link: ({ to, children, ...props }) => <a href={to} {...props}>{children}</a>,
  useNavigate: () => jest.fn(),
  useParams: () => ({ slug: 'p1' })
}), { virtual: true });
jest.mock('@/hooks/useCatalogCategories', () => () => ({ categories: mockCategories }), { virtual: true });
jest.mock('@/hooks/useReveal', () => ({ useReveal: () => ({}) }), { virtual: true });
jest.mock('@/services/catalog', () => ({
  getProduct: () => Promise.resolve(mockProduct),
  listCategoryProducts: () => Promise.resolve([]),
  listProductReviews: () => Promise.resolve([])
}), { virtual: true });
jest.mock('@/services/api', () => ({ getErrorMessage: (error) => error.message, isRequestAborted: () => false }), { virtual: true });
jest.mock('@/seo/Seo', () => () => null, { virtual: true });
jest.mock('@/seo/seoCore.mjs', () => ({ productMeta: () => ({}) }), { virtual: true });
jest.mock('@/utils/images', () => ({ applyImageFallback: jest.fn() }), { virtual: true });
jest.mock('@/assets/placeholders/category-placeholder.png', () => 'placeholder.png', { virtual: true });
jest.mock('@/components/ui/Button', () => ({ children, onClick }) => <button onClick={onClick}>{children}</button>, { virtual: true });
jest.mock('@/components/ui/StarRating', () => () => null, { virtual: true });
jest.mock('@/components/ui/ProductCard', () => () => null, { virtual: true });
jest.mock('@/components/ui/SectionHeading', () => () => null, { virtual: true });

test('disables removed size for its colour and clears selection when colour changes', async () => {
  render(<ProductDetails />);
  const small = await screen.findByRole('button', { name: 'S' });
  expect(small).toBeDisabled();
  fireEvent.click(screen.getByTitle('Black'));
  expect(small).toBeEnabled();
  fireEvent.click(small);
  fireEvent.click(screen.getByTitle('White'));
  expect(small).toBeDisabled();
  expect(small.className).not.toContain('bg-orange-500');
});
