import React, { Suspense, lazy } from 'react';
import { Route, Routes } from 'react-router-dom';
import Seo from '../seo/Seo';
import { HOME_META, STATIC_PAGES, staticPageMeta } from '../seo/seoCore.mjs';

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

const NoIndex = ({ title, children }) => (
  <>
    <Seo title={title} description={`${title} - Adviprints`} noindex />
    {children}
  </>
);

const StaticPage = ({ path, children }) => {
  const page = STATIC_PAGES.find((item) => item.path === path);
  return (
    <>
      <Seo {...staticPageMeta(page)} />
      {children}
    </>
  );
};

const SuspenseFallback = () => <div className="page-loader">Loading...</div>;

const AppRoutes = () => {
  return (
    <Suspense fallback={<SuspenseFallback />}>
      <Routes>
        <Route element={<StorefrontLayout />}>
          <Route path="/" element={<><Seo {...HOME_META} /><Home /></>} />
          <Route path="/category/:slug" element={<Category />} />
          <Route path="/product/:slug" element={<ProductDetails />} />
          <Route path="/about" element={<StaticPage path="/about"><About /></StaticPage>} />
          <Route path="/how-it-works" element={<StaticPage path="/how-it-works"><HowItWorks /></StaticPage>} />
          <Route path="/faq" element={<StaticPage path="/faq"><FAQ /></StaticPage>} />
          <Route path="/contact" element={<StaticPage path="/contact"><Contact /></StaticPage>} />
        </Route>
        <Route path="/checkout" element={<NoIndex title="Checkout"><CheckoutPage /></NoIndex>} />
        <Route path="/order-confirmation" element={<NoIndex title="Order confirmation"><OrderConfirmation /></NoIndex>} />
        <Route path="/order-success/:id" element={<NoIndex title="Order success"><OrderSuccess /></NoIndex>} />
        <Route path="/admin/login" element={<NoIndex title="Admin login"><AdminLogin /></NoIndex>} />
        <Route path="/admin" element={<NoIndex title="Admin"><AdminDashboard /></NoIndex>}>
          <Route index element={<div />} />
          <Route path="dashboard" element={<div />} />
          <Route path="branding" element={<AdminBranding />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="orders" element={<AdminOrdersList />} />
          <Route path="orders/:orderId" element={<AdminOrderDetails />} />
        </Route>
        <Route path="*" element={<NoIndex title="Page not found"><div className="page-loader">Page not found.</div></NoIndex>} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
