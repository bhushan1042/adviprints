import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AdminProducts from './AdminProducts';
import api from '../../../services/api';

jest.mock('../../../services/api', () => ({
  __esModule: true,
  default: { get: jest.fn(), put: jest.fn(), post: jest.fn() },
  withAuth: () => ({}),
  isRequestAborted: () => false,
  getErrorMessage: (error) => error.message
}));

const product = {
  _id: 'p1', name: 'Test product', price: 500, status: 'PENDING',
  sizes: ['M'], colours: ['Black'],
  qikinkVariants: [{ size: 'M', colour: 'Black', sku: 'sku-1', printTypeId: 1, qikinkPrice: 105.5 }]
};

beforeEach(() => {
  jest.clearAllMocks();
  api.get.mockImplementation((url) => Promise.resolve({ data: url === '/categories' ? [] : [product] }));
  api.put.mockResolvedValue({ data: product });
  window.scrollTo = jest.fn();
});

test('editing retains the Qikink price and sends updated price when saving', async () => {
  render(<AdminProducts />);
  fireEvent.click(await screen.findByRole('button', { name: /edit \(requires re-approval\)/i }));
  expect(screen.getByLabelText('Store SKU for Black M')).toHaveValue('sku-1');
  expect(screen.getByLabelText('Product cost for Black M')).toHaveValue(105.5);
  fireEvent.change(screen.getByLabelText('Product cost for Black M'), { target: { value: '120.25' } });
  fireEvent.change(screen.getByLabelText('Product SKU for Black M'), { target: { value: 'product-1' } });
  fireEvent.change(screen.getByLabelText('Design SKU for Black M'), { target: { value: 'design-1' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
  await waitFor(() => expect(api.put).toHaveBeenCalledWith('/products/p1', expect.objectContaining({
    qikinkVariants: [{ size: 'M', colour: 'Black', sku: 'sku-1', printTypeId: 1, qikinkPrice: 120.25, productSku: 'product-1', designSku: 'design-1' }]
  }), expect.anything()));
});

test('invalid Qikink price produces an error without saving', async () => {
  render(<AdminProducts />);
  fireEvent.click(await screen.findByRole('button', { name: /edit \(requires re-approval\)/i }));
  fireEvent.change(screen.getByLabelText('Product cost for Black M'), { target: { value: '-2' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
  expect(api.put).not.toHaveBeenCalled();
});

test('creates five variation rows for one colour and retains entries when sizes change', async () => {
  render(<AdminProducts />);
  await screen.findByRole('button', { name: /edit \(requires re-approval\)/i });
  expect(screen.getByText(/no rows yet/i)).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText(/available sizes/i), { target: { value: 'S, M, L, XL, XXL' } });
  fireEvent.change(screen.getByLabelText(/available colours/i), { target: { value: 'White' } });
  expect(screen.getAllByRole('row')).toHaveLength(6);
  fireEvent.change(screen.getByLabelText('Store SKU for White S'), { target: { value: 'sku-s' } });
  fireEvent.change(screen.getByLabelText(/available sizes/i), { target: { value: 'S, M, L, XL, XXL, XS' } });
  expect(screen.getByLabelText('Store SKU for White S')).toHaveValue('sku-s');
  expect(screen.getAllByRole('row')).toHaveLength(7);
  expect(api.put).not.toHaveBeenCalled();
});

test('add size keeps existing row and its SKU', async () => {
  render(<AdminProducts />);
  fireEvent.click(await screen.findByRole('button', { name: /edit \(requires re-approval\)/i }));
  fireEvent.change(screen.getByLabelText('New size'), { target: { value: 'L' } });
  fireEvent.click(screen.getByRole('button', { name: 'Add size' }));
  expect(screen.getByLabelText('Available sizes')).toHaveValue('M, L');
  expect(screen.getByLabelText('Store SKU for Black M')).toHaveValue('sku-1');
  expect(screen.getByLabelText('Store SKU for Black L')).toHaveValue('');
  fireEvent.change(screen.getByLabelText('New size'), { target: { value: 'm' } });
  fireEvent.click(screen.getByRole('button', { name: 'Add size' }));
  expect(screen.getByText('This size is already in the list.')).toBeInTheDocument();
});

test('removes one row and saves exclusion without deleting other variations', async () => {
  render(<AdminProducts />);
  fireEvent.click(await screen.findByRole('button', { name: /edit \(requires re-approval\)/i }));
  fireEvent.change(screen.getByLabelText('New size'), { target: { value: 'L' } });
  fireEvent.click(screen.getByRole('button', { name: 'Add size' }));
  fireEvent.click(screen.getByRole('button', { name: 'Remove Black L' }));
  expect(screen.queryByLabelText('Store SKU for Black L')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
  await waitFor(() => expect(api.put).toHaveBeenCalledWith('/products/p1', expect.objectContaining({
    qikinkExcludedVariants: [{ size: 'L', colour: 'Black' }],
    qikinkVariants: [expect.objectContaining({ size: 'M', sku: 'sku-1' })]
  }), expect.anything()));
});

test('uploads separate thumbnail and preview images and sends both URLs', async () => {
  api.post.mockResolvedValueOnce({ data: { url: 'https://example.com/detail.jpg' } })
    .mockResolvedValueOnce({ data: { url: 'https://example.com/thumb.jpg' } });
  render(<AdminProducts />);
  fireEvent.click(await screen.findByRole('button', { name: /edit \(requires re-approval\)/i }));
  fireEvent.change(screen.getByLabelText(/product thumbnail image/i), { target: { files: [new File(['thumb'], 'thumb.png', { type: 'image/png' })] } });
  fireEvent.change(screen.getByLabelText(/product images/i), { target: { files: [new File(['detail'], 'detail.png', { type: 'image/png' })] } });
  fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
  await waitFor(() => expect(api.put).toHaveBeenCalledWith('/products/p1', expect.objectContaining({
    thumbnailUrl: 'https://example.com/thumb.jpg',
    imageUrl: 'https://example.com/detail.jpg'
  }), expect.anything()));
});

test('retains existing images when editing without selecting files', async () => {
  api.get.mockImplementation((url) => Promise.resolve({ data: url === '/categories' ? [] : [{ ...product, imageUrl: '/detail.jpg', thumbnailUrl: '/thumb.jpg' }] }));
  render(<AdminProducts />);
  fireEvent.click(await screen.findByRole('button', { name: /edit \(requires re-approval\)/i }));
  fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
  await waitFor(() => expect(api.put).toHaveBeenCalledWith('/products/p1', expect.objectContaining({
    thumbnailUrl: '/thumb.jpg', imageUrl: '/detail.jpg'
  }), expect.anything()));
  expect(api.post).not.toHaveBeenCalled();
});

test('does not save when the thumbnail upload fails', async () => {
  api.post.mockRejectedValueOnce(new Error('Thumbnail upload failed'));
  render(<AdminProducts />);
  fireEvent.click(await screen.findByRole('button', { name: /edit \(requires re-approval\)/i }));
  fireEvent.change(screen.getByLabelText(/product thumbnail image/i), { target: { files: [new File(['thumb'], 'thumb.png', { type: 'image/png' })] } });
  fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
  expect(await screen.findByText('Thumbnail upload failed')).toBeInTheDocument();
  expect(api.put).not.toHaveBeenCalled();
});
