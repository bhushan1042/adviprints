import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import IndexPage from './pages/IndexPage';
import Navbar from './components/Navbar';
import CategoryPage from './pages/CategoryPage';
import ProductPage from './pages/ProductPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderConfirmation from './pages/OrderConfirmation';
import OrderSuccess from './pages/OrderSuccess';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import AdminOrdersList from './pages/AdminOrdersList';
import AdminOrderDetails from './pages/AdminOrderDetails';
import AdminBranding from './pages/AdminBranding';
import './App.css';

const App = () => {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<IndexPage />} />
        <Route path="/category/:id" element={<CategoryPage />} />
        <Route path="/product/:id" element={<ProductPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/order-confirmation" element={<OrderConfirmation />} />
        <Route path="/order-success/:id" element={<OrderSuccess />} />

        {/* Admin Routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminDashboard />}>
          <Route path="dashboard" element={<div />} />
          <Route path="branding" element={<AdminBranding />} />
          <Route path="orders" element={<AdminOrdersList />} />
          <Route path="orders/:orderId" element={<AdminOrderDetails />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;