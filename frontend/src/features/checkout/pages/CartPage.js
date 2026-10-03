import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styles from './CartPage.module.css';

const CartPage = () => {
  const [cartItems, setCartItems] = useState([]);
  const [savedDesigns, setSavedDesigns] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem('cartItems');
    const designs = localStorage.getItem('savedDesigns');
    if (saved) setCartItems(JSON.parse(saved));
    if (designs) setSavedDesigns(JSON.parse(designs));
  }, []);

  const calculateSubtotal = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const calculateTax = () => {
    return calculateSubtotal() * 0.18;
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax() + 50; // 50 for shipping
  };

  const removeFromCart = (id) => {
    const updated = cartItems.filter(item => item.id !== id);
    setCartItems(updated);
    localStorage.setItem('cartItems', JSON.stringify(updated));
  };

  const updateQuantity = (id, qty) => {
    const updated = cartItems.map(item => 
      item.id === id ? { ...item, quantity: Math.max(1, qty) } : item
    );
    setCartItems(updated);
    localStorage.setItem('cartItems', JSON.stringify(updated));
  };

  const handleCheckout = () => {
    localStorage.setItem('checkoutItems', JSON.stringify(cartItems));
    window.location.href = '/checkout';
  };

  if (cartItems.length === 0) {
    return (
      <div className={styles.emptyCart}>
        <div className={styles.emptyContent}>
          <div className={styles.emptyIcon}>🛒</div>
          <h2>Your Cart is Empty</h2>
          <p>Start designing your custom products</p>
          <Link to="/products" className={styles.continueShoppingBtn}>
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.cartPage}>
      <div className={styles.cartContainer}>
        <h1>Shopping Cart</h1>

        <div className={styles.cartLayout}>
          <div className={styles.cartItems}>
            {cartItems.map(item => (
              <div key={item.id} className={styles.cartItem}>
                <div className={styles.itemImage}>
                  {item.designPreview && (
                    <img src={item.designPreview} alt={item.productName} />
                  )}
                </div>

                <div className={styles.itemDetails}>
                  <h3>{item.productName}</h3>
                  <p className={styles.itemDescription}>
                    Size: <strong>{item.size}</strong> | Color: <strong>{item.color}</strong>
                  </p>
                  {item.template && (
                    <p className={styles.itemTemplate}>
                      Template: <strong>{item.template === 'centered' ? 'Centered Print' : 'Chest Pocket'}</strong>
                    </p>
                  )}
                </div>

                <div className={styles.itemPrice}>
                  <p>₹{item.price.toFixed(2)}</p>
                </div>

                <div className={styles.quantityControl}>
                  <button onClick={() => updateQuantity(item.id, item.quantity - 1)}>−</button>
                  <input 
                    type="number" 
                    value={item.quantity} 
                    onChange={(e) => updateQuantity(item.id, parseInt(e.target.value))}
                    min="1"
                  />
                  <button onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
                </div>

                <div className={styles.itemSubtotal}>
                  ₹{(item.price * item.quantity).toFixed(2)}
                </div>

                <button 
                  className={styles.removeBtn}
                  onClick={() => removeFromCart(item.id)}
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          <div className={styles.cartSummary}>
            <h2>Order Summary</h2>

            <div className={styles.summaryRow}>
              <span>Subtotal</span>
              <span>₹{calculateSubtotal().toFixed(2)}</span>
            </div>

            <div className={styles.summaryRow}>
              <span>Tax (18%)</span>
              <span>₹{calculateTax().toFixed(2)}</span>
            </div>

            <div className={styles.summaryRow}>
              <span>Shipping</span>
              <span>₹50.00</span>
            </div>

            <div className={styles.divider}></div>

            <div className={styles.totalRow}>
              <span>Total</span>
              <span>₹{calculateTotal().toFixed(2)}</span>
            </div>

            <button className={styles.checkoutBtn} onClick={handleCheckout}>
              Proceed to Checkout
            </button>

            <Link to="/products" className={styles.continueShoppingLink}>
              Continue Shopping
            </Link>

            {savedDesigns.length > 0 && (
              <div className={styles.savedDesigns}>
                <h3>Saved Designs ({savedDesigns.length})</h3>
                <div className={styles.designsList}>
                  {savedDesigns.map((design, idx) => (
                    <div key={idx} className={styles.designItem}>
                      {design.preview && (
                        <img src={design.preview} alt="Saved design" />
                      )}
                      <p>{design.name || `Design ${idx + 1}`}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
