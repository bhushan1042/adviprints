import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styles from './CheckoutPage.module.css';

const CheckoutPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [cartItems, setCartItems] = useState([]);
  const [designData, setDesignData] = useState(null);
  const [step, setStep] = useState('address'); // address, payment, review
  const [isProcessing, setIsProcessing] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    landmark: ''
  });

  const [paymentMethod, setPaymentMethod] = useState('card');
  
  const [cardData, setCardData] = useState({
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: ''
  });

  const [upiData, setUpiData] = useState({
    upiId: ''
  });

  useEffect(() => {
    // Get design data from location state (passed from PreviewPage)
    const stateData = location.state?.designData;
    const stateProduct = location.state?.product;
    if (stateData) {
      setDesignData(stateData);
      // Create a single cart item from the design data
      if (stateProduct) {
        setCartItems([{
          id: Date.now(),
          product: stateProduct,
          designData: stateData,
          quantity: 1,
          price: stateProduct?.price || 19.99
        }]);
      }
    }
  }, [location.state]);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCardChange = (e) => {
    const { name, value } = e.target;
    let formatted = value;
    
    if (name === 'cardNumber') {
      formatted = value.replace(/\s+/g, '').replace(/(\d{4})/g, '$1 ').trim();
    } else if (name === 'expiryDate') {
      formatted = value.replace(/\D/g, '');
      if (formatted.length >= 2) {
        formatted = formatted.slice(0, 2) + '/' + formatted.slice(2, 4);
      }
    } else if (name === 'cvv') {
      formatted = value.replace(/\D/g, '').slice(0, 3);
    }
    
    setCardData(prev => ({ ...prev, [name]: formatted }));
  };

  const handleUpiChange = (e) => {
    const { name, value } = e.target;
    setUpiData(prev => ({ ...prev, [name]: value }));
  };

  const validateAddress = () => {
    return formData.fullName && formData.email && formData.phone && 
           formData.address && formData.city && formData.state && formData.pincode;
  };

  const validateCard = () => {
    return cardData.cardNumber.replace(/\s/g, '').length === 16 &&
           cardData.cardName && cardData.expiryDate && cardData.cvv.length === 3;
  };

  const validateUpi = () => {
    return upiData.upiId && upiData.upiId.includes('@');
  };

  const handlePlaceOrder = async () => {
    if (step === 'address') {
      if (!validateAddress()) {
        alert('Please fill all address fields');
        return;
      }
      setStep('payment');
      return;
    }

    if (step === 'payment') {
      if (paymentMethod === 'card' && !validateCard()) {
        alert('Please enter valid card details');
        return;
      }
      if (paymentMethod === 'upi' && !validateUpi()) {
        alert('Please enter valid UPI ID');
        return;
      }
      setStep('review');
      return;
    }

    if (step === 'review') {
      setIsProcessing(true);
      
      // Save each order with design data to backend
      const saveOrders = async () => {
        try {
          let lastOrderId = null;

          for (const item of cartItems) {
            const orderPayload = {
              customerName: formData.fullName,
              customerEmail: formData.email,
              customerPhone: formData.phone,
              address: {
                street: formData.address,
                city: formData.city,
                state: formData.state,
                zipCode: formData.pincode,
                country: 'India'
              },
              productId: item.product?._id,
              productName: item.product?.name || 'Custom T-Shirt',
              productPrice: item.product?.price || item.price || 19.99,
              productCode: item.product?.productCode || null,
              designTemplate: item.designData?.template || 'centered',
              originalImage: item.designData?.originalImage || '',
              previewImage: item.designData?.previewImage || '',
              uploadedImage: item.designData?.uploadedImage || '',
              position: item.designData?.position || {},
              quantity: item.quantity || 1,
              totalPrice: (item.price * item.quantity).toFixed(2),
              paymentMethod: paymentMethod
            };

            const response = await fetch('${API_BASE}/api/orders/${orderId}', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(orderPayload)
            });

            if (!response.ok) {
              const error = await response.json();
              throw new Error(error.details || error.error || 'Failed to save order');
            }

            const result = await response.json();
            lastOrderId = result.orderId; // Capture the order ID from response
          }

          // Clear cart and navigate to order success page with order ID
          localStorage.removeItem('customCart');
          localStorage.removeItem('checkoutItems');
          localStorage.removeItem('cartItems');
          
          setIsProcessing(false);
          
          // Navigate to order success page with the actual order ID
          if (lastOrderId) {
            navigate(`/order-success/${lastOrderId}`);
          } else {
            navigate('/');
          }
        } catch (err) {
          setIsProcessing(false);
          alert('Error saving order: ' + err.message);
          console.error('Order save error:', err);
        }
      };

      saveOrders();
    }
  };

  const calculateTotal = () => {
    const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = subtotal * 0.18;
    return subtotal + tax + 50;
  };

  return (
    <div className={styles.checkoutPage}>
      <div className={styles.checkoutContainer}>
        <div className={styles.progressBar}>
          <div className={`${styles.progressStep} ${step === 'address' ? styles.active : ''} ${['payment', 'review'].includes(step) ? styles.completed : ''}`}>
            <span>1</span>
            <label>Delivery Address</label>
          </div>
          <div className={styles.progressLine}></div>
          <div className={`${styles.progressStep} ${step === 'payment' ? styles.active : ''} ${step === 'review' ? styles.completed : ''}`}>
            <span>2</span>
            <label>Payment Method</label>
          </div>
          <div className={styles.progressLine}></div>
          <div className={`${styles.progressStep} ${step === 'review' ? styles.active : ''}`}>
            <span>3</span>
            <label>Review & Order</label>
          </div>
        </div>

        <div className={styles.checkoutLayout}>
          <div className={styles.formSection}>
            {step === 'address' && (
              <div className={styles.addressForm}>
                <h2>Delivery Address</h2>
                
                <div className={styles.formGroup}>
                  <label>Full Name</label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleFormChange}
                    placeholder="Enter your full name"
                  />
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Email</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleFormChange}
                      placeholder="your@email.com"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Phone</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleFormChange}
                      placeholder="+91 XXXXX XXXXX"
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label>Address</label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleFormChange}
                    placeholder="Street address"
                    rows="3"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Landmark (Optional)</label>
                  <input
                    type="text"
                    name="landmark"
                    value={formData.landmark}
                    onChange={handleFormChange}
                    placeholder="Nearby landmark"
                  />
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>City</label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleFormChange}
                      placeholder="City"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>State</label>
                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleFormChange}
                      placeholder="State"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Pincode</label>
                    <input
                      type="text"
                      name="pincode"
                      value={formData.pincode}
                      onChange={handleFormChange}
                      placeholder="100000"
                    />
                  </div>
                </div>
              </div>
            )}

            {step === 'payment' && (
              <div className={styles.paymentForm}>
                <h2>Payment Method</h2>

                <div className={styles.paymentOptions}>
                  <label className={`${styles.paymentOption} ${paymentMethod === 'card' ? styles.selected : ''}`}>
                    <input
                      type="radio"
                      value="card"
                      checked={paymentMethod === 'card'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    />
                    <span className={styles.optionLabel}>💳 Credit/Debit Card</span>
                  </label>

                  <label className={`${styles.paymentOption} ${paymentMethod === 'upi' ? styles.selected : ''}`}>
                    <input
                      type="radio"
                      value="upi"
                      checked={paymentMethod === 'upi'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    />
                    <span className={styles.optionLabel}>📱 UPI</span>
                  </label>

                  <label className={`${styles.paymentOption} ${paymentMethod === 'cod' ? styles.selected : ''}`}>
                    <input
                      type="radio"
                      value="cod"
                      checked={paymentMethod === 'cod'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    />
                    <span className={styles.optionLabel}>🏠 Cash on Delivery</span>
                  </label>
                </div>

                {paymentMethod === 'card' && (
                  <div className={styles.cardForm}>
                    <div className={styles.cardPreview}>
                      <div className={styles.cardChip}>Chip</div>
                      <div className={styles.cardNumber}>
                        {cardData.cardNumber || 'XXXX XXXX XXXX XXXX'}
                      </div>
                      <div className={styles.cardFooter}>
                        <span>{cardData.cardName || 'CARDHOLDER NAME'}</span>
                        <span>{cardData.expiryDate || 'MM/YY'}</span>
                      </div>
                    </div>

                    <div className={styles.formGroup}>
                      <label>Cardholder Name</label>
                      <input
                        type="text"
                        name="cardName"
                        value={cardData.cardName}
                        onChange={handleCardChange}
                        placeholder="Name on card"
                        maxLength="30"
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label>Card Number</label>
                      <input
                        type="text"
                        name="cardNumber"
                        value={cardData.cardNumber}
                        onChange={handleCardChange}
                        placeholder="1234 5678 9012 3456"
                        maxLength="19"
                      />
                    </div>

                    <div className={styles.formRow}>
                      <div className={styles.formGroup}>
                        <label>Expiry Date</label>
                        <input
                          type="text"
                          name="expiryDate"
                          value={cardData.expiryDate}
                          onChange={handleCardChange}
                          placeholder="MM/YY"
                          maxLength="5"
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label>CVV</label>
                        <input
                          type="text"
                          name="cvv"
                          value={cardData.cvv}
                          onChange={handleCardChange}
                          placeholder="123"
                          maxLength="3"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {paymentMethod === 'upi' && (
                  <div className={styles.upiForm}>
                    <div className={styles.upiIcon}>📱</div>
                    <div className={styles.formGroup}>
                      <label>UPI ID</label>
                      <input
                        type="text"
                        name="upiId"
                        value={upiData.upiId}
                        onChange={handleUpiChange}
                        placeholder="yourname@upi"
                      />
                    </div>
                  </div>
                )}

                {paymentMethod === 'cod' && (
                  <div className={styles.codInfo}>
                    <div className={styles.codIcon}>🏠</div>
                    <p>Pay when you receive your order</p>
                  </div>
                )}
              </div>
            )}

            {step === 'review' && (
              <div className={styles.reviewForm}>
                <h2>Review Your Order</h2>

                <div className={styles.reviewSection}>
                  <h3>Delivery Address</h3>
                  <p className={styles.reviewText}>
                    {formData.fullName}<br />
                    {formData.address}, {formData.landmark}<br />
                    {formData.city}, {formData.state} {formData.pincode}<br />
                    📧 {formData.email} | ☎️ {formData.phone}
                  </p>
                  <button className={styles.editBtn} onClick={() => setStep('address')}>Edit</button>
                </div>

                <div className={styles.reviewSection}>
                  <h3>Payment Method</h3>
                  <p className={styles.reviewText}>
                    {paymentMethod === 'card' && `💳 Card ending in ${cardData.cardNumber.slice(-4)}`}
                    {paymentMethod === 'upi' && `📱 UPI: ${upiData.upiId}`}
                    {paymentMethod === 'cod' && '🏠 Cash on Delivery'}
                  </p>
                  <button className={styles.editBtn} onClick={() => setStep('payment')}>Edit</button>
                </div>

                <div className={styles.reviewSection}>
                  <h3>Items</h3>
                  {cartItems.map((item, idx) => (
                    <div key={idx} className={styles.reviewItem}>
                      <span>{item.productName} (x{item.quantity})</span>
                      <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className={styles.orderSummarySection}>
            <div className={styles.orderSummary}>
              <h3>Order Summary</h3>
              
              <div className={styles.summaryItems}>
                {cartItems.map((item, idx) => (
                  <div key={idx} className={styles.summaryItem}>
                    <span>{item.productName}</span>
                    <span>x{item.quantity}</span>
                    <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className={styles.divider}></div>

              <div className={styles.summaryRow}>
                <span>Subtotal</span>
                <span>₹{cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}</span>
              </div>

              <div className={styles.summaryRow}>
                <span>Tax (18%)</span>
                <span>₹{(cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0) * 0.18).toFixed(2)}</span>
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

              <button
                className={styles.placeOrderBtn}
                onClick={handlePlaceOrder}
                disabled={isProcessing}
              >
                {isProcessing ? 'Processing...' : step === 'address' ? 'Continue to Payment' : step === 'payment' ? 'Review Order' : 'Place Order'}
              </button>

              <button
                className={styles.backBtn}
                onClick={() => {
                  if (step === 'payment') setStep('address');
                  else if (step === 'review') setStep('payment');
                  else navigate('/cart');
                }}
              >
                ← Back
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
