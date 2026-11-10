import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import CategoryCarousel from './CategoryCarousel';

jest.mock('react-router-dom', () => ({
  Link: ({ to, children, ...props }) => <a href={to} {...props}>{children}</a>
}), { virtual: true });

const categories = Array.from({ length: 8 }, (_, index) => ({
  id: `category-${index}`,
  slug: `category-${index}`,
  name: `Category ${index}`,
  image: `/category-${index}.jpg`
}));

test('renders every category as a catalog link', () => {
  render(<CategoryCarousel categories={categories} />);

  const links = screen.getAllByRole('link');
  expect(links).toHaveLength(8);
  expect(links[7]).toHaveAttribute('href', '/category/category-7');
  expect(screen.queryByRole('button', { name: /categories/i })).not.toBeInTheDocument();
});

test('controls follow overflow and scroll position', () => {
  const originalClientWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'clientWidth');
  const originalScrollWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'scrollWidth');
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, value: 400 });
  Object.defineProperty(HTMLElement.prototype, 'scrollWidth', { configurable: true, value: 800 });

  try {
    const { container } = render(<CategoryCarousel categories={categories} />);
    const track = container.querySelector('[class*="track"]');
    track.scrollBy = jest.fn();
    expect(screen.queryByRole('button', { name: 'Previous categories' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Next categories' }));
    expect(track.scrollBy).toHaveBeenCalledTimes(1);

    Object.defineProperty(track, 'scrollLeft', { configurable: true, value: 400 });
    fireEvent.scroll(track);
    expect(screen.getByRole('button', { name: 'Previous categories' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Next categories' })).not.toBeInTheDocument();
  } finally {
    if (originalClientWidth) Object.defineProperty(HTMLElement.prototype, 'clientWidth', originalClientWidth);
    if (originalScrollWidth) Object.defineProperty(HTMLElement.prototype, 'scrollWidth', originalScrollWidth);
  }
});
