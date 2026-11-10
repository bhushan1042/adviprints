import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styles from './CartPage.module.css';

const CART_KEY = 'adviprintsCart';

const CartPage = () => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [cartError, setCartError] = useState('');

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
      setCartItems(Array.isArray(saved) ? saved : []);
    } catch (error) {
      setCartItems([]);
      setCartError('Your saved cart could not be read. Clear the damaged cart data before continuing.');
    }
  }, []);

  const saveCart = (items) => {
    setCartItems(items);
    localStorage.setItem(CART_KEY, JSON.stringify(items));
    sessionStorage.removeItem('adviprintsCheckoutId');
  };

  const updateQuantity = (id, quantity) => {
    if (!Number.isInteger(quantity) || quantity < 1) return;
    saveCart(cartItems.map((item, index) => index === id ? { ...item, quantity: Math.min(quantity, 100) } : item));
  };

  const removeFromCart = (id) => saveCart(cartItems.filter((_, index) => index !== id));
  const subtotal = cartItems.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0);

  if (cartItems.length === 0) {
    return (
      <div className={styles.emptyCart}>
        <div className={styles.emptyContent}>
          <div className={styles.emptyIcon}>🛒</div>
          {cartError ? <p role="alert">{cartError}</p> : null}
          <h2>Your Cart is Empty</h2>
          <p>Browse ready-designed products and add an item to your cart.</p>
          <Link to="/category/all" className={styles.continueShoppingBtn}>Continue Shopping</Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.cartPage}>
      <div className={styles.cartContainer}>
        <h1>Shopping Cart</h1>
        {cartError ? <p role="alert">{cartError}</p> : null}
        <div className={styles.cartLayout}>
          <div className={styles.cartItems}>
            {cartItems.map((item, index) => (
              <div key={`${item.productId}-${item.size}-${item.colour}`} className={styles.cartItem}>
                <div className={styles.itemImage}>
                  {item.productImageUrl ? <img src={item.productImageUrl} alt={item.productName} /> : null}
                </div>
                <div className={styles.itemDetails}>
                  <h3>{item.productName}</h3>
                  <p className={styles.itemDescription}>Size: <strong>{item.size}</strong> | Colour: <strong>{item.colour}</strong></p>
                </div>
                <div className={styles.itemPrice}><p>₹{Number(item.price).toFixed(2)}</p></div>
                <div className={styles.quantityControl}>
                  <button type="button" onClick={() => updateQuantity(index, Number(item.quantity) - 1)} aria-label="Decrease quantity">−</button>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={item.quantity}
                    onChange={(event) => updateQuantity(index, Number(event.target.value))}
                    aria-label={`Quantity for ${item.productName}`}
                  />
                  <button type="button" onClick={() => updateQuantity(index, Number(item.quantity) + 1)} aria-label="Increase quantity">+</button>
                </div>
                <div className={styles.itemSubtotal}>₹{(Number(item.price) * Number(item.quantity)).toFixed(2)}</div>
                <button type="button" className={styles.removeBtn} onClick={() => removeFromCart(index)} aria-label={`Remove ${item.productName}`}>×</button>
              </div>
            ))}
          </div>
          <div className={styles.cartSummary}>
            <h2>Order Summary</h2>
            <div className={styles.summaryRow}><span>Subtotal</span><span>₹{subtotal.toFixed(2)}</span></div>
            <div className={styles.divider}></div>
            <div className={styles.totalRow}><span>Total</span><span>₹{subtotal.toFixed(2)}</span></div>
            <button type="button" className={styles.checkoutBtn} onClick={() => navigate('/checkout')}>Proceed to Checkout</button>
            <Link to="/category/all" className={styles.continueShoppingLink}>Continue Shopping</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
