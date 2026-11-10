import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ProductCard from './ProductCard';

jest.mock('react-router-dom', () => ({
  Link: ({ to, children, ...props }) => <a href={to} {...props}>{children}</a>
}), { virtual: true });
jest.mock('@/assets/placeholders/category-placeholder.png', () => 'placeholder.png', { virtual: true });
jest.mock('@/utils/images', () => ({ applyImageFallback: jest.fn() }), { virtual: true });

test('uses the thumbnail rather than the detail image in product cards', () => {
  render(<ProductCard product={{ id: '1', slug: '1', name: 'Mug', thumbnail: '/thumb.jpg', images: ['/detail.jpg'], price: 100, colors: [], rating: 0 }} />);
  expect(screen.getByRole('img', { name: 'Mug' })).toHaveAttribute('src', '/thumb.jpg');
  expect(screen.getByRole('link', { name: 'View Mug' })).toHaveAttribute('href', '/product/1');
  expect(screen.queryByLabelText(/out of 5/i)).not.toBeInTheDocument();
});

test('displays real review information and available colours', () => {
  render(<ProductCard product={{ id: '2', slug: 'mug-2', name: 'Blue mug', images: ['/detail.jpg'], price: 200, colors: [{ name: 'Blue', hex: '#0000ff' }], rating: 4.5, reviewCount: 3 }} />);
  expect(screen.getByLabelText('4.5 out of 5, 3 reviews')).toBeInTheDocument();
  expect(screen.getByLabelText('Colours: Blue')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'View Blue mug' })).toHaveAttribute('href', '/product/mug-2');
});
