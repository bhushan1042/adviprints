import React, { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import styles from './OrderConfirmation.module.css';

const OrderConfirmation = () => {
  const location = useLocation();
  const [orderData, setOrderData] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem('lastOrder');
    if (saved) {
      setOrderData(JSON.parse(saved));
    }
  }, []);

  if (!orderData) {
    return (
      <div className={styles.container}>
        <div className={styles.errorState}>
          <div className={styles.errorIcon}>⚠️</div>
          <h1>Order Not Found</h1>
          <p>Your order confirmation cannot be retrieved.</p>
          <Link to="/" className={styles.homeBtn}>Back to Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.confirmationBox}>
        <div className={styles.successIcon}>✓</div>
        
        <h1>Order Confirmed!</h1>
        <p className={styles.subtitle}>Thank you for your purchase</p>

        <div className={styles.orderNumber}>
          <strong>Order ID:</strong> {orderData.orderId}
        </div>

        <div className={styles.orderDetails}>
          <h2>Delivery Address</h2>
          <p>
            {orderData.address.fullName}<br />
            {orderData.address.address}<br />
            {orderData.address.city}, {orderData.address.state} {orderData.address.pincode}<br />
            📧 {orderData.address.email} | ☎️ {orderData.address.phone}
          </p>
        </div>

        <div className={styles.orderItems}>
          <h2>Order Items</h2>
          {orderData.items.map((item, idx) => (
            <div key={idx} className={styles.itemRow}>
              <span>{item.productName} (x{item.quantity})</span>
              <span>₹{(item.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
        </div>

        <div className={styles.orderSummary}>
          <div className={styles.summaryRow}>
            <span>Subtotal</span>
            <span>₹{orderData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}</span>
          </div>
          <div className={styles.summaryRow}>
            <span>Tax (18%)</span>
            <span>₹{(orderData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0) * 0.18).toFixed(2)}</span>
          </div>
          <div className={styles.summaryRow}>
            <span>Shipping</span>
            <span>₹50.00</span>
          </div>
          <div className={styles.divider}></div>
          <div className={styles.totalRow}>
            <span>Total</span>
            <span>₹{(orderData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0) * 1.18 + 50).toFixed(2)}</span>
          </div>
        </div>

        <div className={styles.nextSteps}>
          <h3>What's next?</h3>
          <ul>
            <li>📧 You'll receive a confirmation email shortly</li>
            <li>📦 Your order will be prepared within 2-3 business days</li>
            <li>🚚 Tracking information will be sent once shipped</li>
            <li>👕 Expect delivery in 5-7 business days</li>
          </ul>
        </div>

        <div className={styles.actions}>
          <Link to="/products" className={styles.continueBtn}>Continue Shopping</Link>
          <Link to="/account/orders" className={styles.ordersBtn}>View Orders</Link>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmation;
