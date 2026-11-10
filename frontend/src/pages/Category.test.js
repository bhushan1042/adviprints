import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Category from './Category';

let mockSlug = 'all';
let mockCatalog;
const mockListProducts = jest.fn();
const mockListCategoryProducts = jest.fn();

jest.mock('react-router-dom', () => ({
  Link: ({ to, children, ...props }) => <a href={to} {...props}>{children}</a>,
  useParams: () => ({ slug: mockSlug })
}), { virtual: true });
jest.mock('@/hooks/useCatalogCategories', () => () => mockCatalog, { virtual: true });
jest.mock('@/services/catalog', () => ({
  listProducts: (...args) => mockListProducts(...args),
  listCategoryProducts: (...args) => mockListCategoryProducts(...args)
}), { virtual: true });
jest.mock('@/services/api', () => ({
  getErrorMessage: (error) => error.message,
  isRequestAborted: () => false
}), { virtual: true });
jest.mock('@/utils/images', () => ({ applyImageFallback: jest.fn() }), { virtual: true });
jest.mock('@/assets/placeholders/category-placeholder.png', () => 'placeholder.png', { virtual: true });
jest.mock('@/seo/Seo', () => () => null, { virtual: true });
jest.mock('@/seo/seoCore.mjs', () => ({
  CATEGORIES_META: {},
  categoryMeta: () => ({})
}), { virtual: true });
jest.mock('@/components/ui/ProductCard', () => ({ product }) => (
  <a href={`/product/${product.id}`}>{product.name}</a>
), { virtual: true });

const categories = [
  { id: '1', slug: 'mugs', name: 'Mugs', image: '/mugs.jpg' },
  { id: '2', slug: 'bags', name: 'Bags', image: '/bags.jpg' }
];
const products = [
  { id: '1', name: 'Mug one', price: 200, rating: 4 },
  { id: '2', name: 'Mug two', price: 100, rating: 5 }
];

beforeEach(() => {
  mockSlug = 'all';
  mockCatalog = { categories, loading: false, error: '' };
  mockListProducts.mockReset().mockResolvedValue(products);
  mockListCategoryProducts.mockReset().mockResolvedValue(products);
});

test('all categories shows category links without requesting products', () => {
  render(<Category />);
  expect(screen.getByRole('heading', { name: 'All Categories' })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Mugs' }).closest('a')).toHaveAttribute('href', '/category/mugs');
  expect(screen.getByRole('heading', { name: 'Bags' }).closest('a')).toHaveAttribute('href', '/category/bags');
  expect(screen.queryByRole('link', { name: /all products/i })).not.toBeInTheDocument();
  expect(mockListProducts).not.toHaveBeenCalled();
  expect(mockListCategoryProducts).not.toHaveBeenCalled();
  expect(screen.queryByText(/filter/i)).not.toBeInTheDocument();
});

test('category pages fetch the correct products and support sorting', async () => {
  mockSlug = 'mugs';
  render(<Category />);
  expect(await screen.findByRole('link', { name: 'Mug one' })).toBeInTheDocument();
  expect(mockListCategoryProducts).toHaveBeenCalledWith('mugs', categories, expect.any(AbortSignal));
  fireEvent.change(screen.getByLabelText('Sort by'), { target: { value: 'price-low' } });
  const links = screen.getAllByRole('link', { name: /mug (one|two)/i });
  expect(links.map((link) => link.textContent)).toEqual(['Mug two', 'Mug one']);
  expect(screen.queryByText(/filter/i)).not.toBeInTheDocument();
  expect(mockListProducts).not.toHaveBeenCalled();
});

test('shows loading, error and empty states instead of a misleading category list', () => {
  mockCatalog = { categories: [], loading: true, error: '' };
  const { rerender } = render(<Category />);
  expect(screen.getByText('Loading categories…')).toBeInTheDocument();
  mockCatalog = { categories: [], loading: false, error: 'Could not load categories' };
  rerender(<Category />);
  expect(screen.getByRole('alert')).toHaveTextContent('Could not load categories');
  expect(screen.queryByText(/no categories/i)).not.toBeInTheDocument();
  mockCatalog = { categories: [], loading: false, error: '' };
  rerender(<Category />);
  expect(screen.getByText(/no categories are available/i)).toBeInTheDocument();
});

test('reports product errors and empty product lists', async () => {
  mockSlug = 'mugs';
  mockListCategoryProducts.mockRejectedValueOnce(new Error('Could not load products'));
  const { unmount } = render(<Category />);
  expect(await screen.findByRole('alert')).toHaveTextContent('Could not load products');
  unmount();
  mockListCategoryProducts.mockResolvedValueOnce([]);
  render(<Category />);
  await waitFor(() => expect(screen.getByText(/no products are available/i)).toBeInTheDocument());
});
