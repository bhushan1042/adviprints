import React, { Suspense, lazy } from 'react';
import { Route, Routes } from 'react-router-dom';

const IndexPage = lazy(() => import('../features/home/pages/IndexPage'));
const CategoryPage = lazy(() => import('../features/catalog/pages/CategoryPage'));
const ProductPage = lazy(() => import('../features/catalog/pages/ProductPage'));
const CheckoutPage = lazy(() => import('../features/checkout/pages/CheckoutPage'));
const OrderConfirmation = lazy(() => import('../features/checkout/pages/OrderConfirmation'));
const OrderSuccess = lazy(() => import('../features/checkout/pages/OrderSuccess'));
const AdminLogin = lazy(() => import('../features/admin/pages/AdminLogin'));
const AdminDashboard = lazy(() => import('../features/admin/pages/AdminDashboard'));
const AdminBranding = lazy(() => import('../features/admin/pages/AdminBranding'));
const AdminOrdersList = lazy(() => import('../features/admin/pages/AdminOrdersList'));
const AdminOrderDetails = lazy(() => import('../features/admin/pages/AdminOrderDetails'));

const SuspenseFallback = () => <div className="page-loader">Loading...</div>;

const AppRoutes = () => {
  return (
    <Suspense fallback={<SuspenseFallback />}>
      <Routes>
        <Route path="/" element={<IndexPage />} />
        <Route path="/category/:id" element={<CategoryPage />} />
        <Route path="/product/:id" element={<ProductPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/order-confirmation" element={<OrderConfirmation />} />
        <Route path="/order-success/:id" element={<OrderSuccess />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminDashboard />}>
          <Route index element={<div />} />
          <Route path="dashboard" element={<div />} />
          <Route path="branding" element={<AdminBranding />} />
          <Route path="orders" element={<AdminOrdersList />} />
          <Route path="orders/:orderId" element={<AdminOrderDetails />} />
        </Route>
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
