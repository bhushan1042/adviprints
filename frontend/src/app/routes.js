import React, { Suspense, lazy } from 'react';
import { Route, Routes } from 'react-router-dom';

const StorefrontLayout = lazy(() => import('../components/layout/StorefrontLayout'));
const Home = lazy(() => import('../pages/Home'));
const Category = lazy(() => import('../pages/Category'));
const ProductDetails = lazy(() => import('../pages/ProductDetails'));
const About = lazy(() => import('../pages/About'));
const HowItWorks = lazy(() => import('../pages/HowItWorks'));
const FAQ = lazy(() => import('../pages/FAQ'));
const Contact = lazy(() => import('../pages/Contact'));
const CheckoutPage = lazy(() => import('../features/checkout/pages/CheckoutPage'));
const OrderConfirmation = lazy(() => import('../features/checkout/pages/OrderConfirmation'));
const OrderSuccess = lazy(() => import('../features/checkout/pages/OrderSuccess'));
const AdminLogin = lazy(() => import('../features/admin/pages/AdminLogin'));
const AdminDashboard = lazy(() => import('../features/admin/pages/AdminDashboard'));
const AdminBranding = lazy(() => import('../features/admin/pages/AdminBranding'));
const AdminProducts = lazy(() => import('../features/admin/pages/AdminProducts'));
const AdminOrdersList = lazy(() => import('../features/admin/pages/AdminOrdersList'));
const AdminOrderDetails = lazy(() => import('../features/admin/pages/AdminOrderDetails'));

const SuspenseFallback = () => <div className="page-loader">Loading...</div>;

const AppRoutes = () => {
  return (
    <Suspense fallback={<SuspenseFallback />}>
      <Routes>
        <Route element={<StorefrontLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/category/:slug" element={<Category />} />
          <Route path="/product/:slug" element={<ProductDetails />} />
          <Route path="/about" element={<About />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/contact" element={<Contact />} />
        </Route>
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/order-confirmation" element={<OrderConfirmation />} />
        <Route path="/order-success/:id" element={<OrderSuccess />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminDashboard />}>
          <Route index element={<div />} />
          <Route path="dashboard" element={<div />} />
          <Route path="branding" element={<AdminBranding />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="orders" element={<AdminOrdersList />} />
          <Route path="orders/:orderId" element={<AdminOrderDetails />} />
        </Route>
        <Route path="*" element={<div className="page-loader">Page not found.</div>} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
