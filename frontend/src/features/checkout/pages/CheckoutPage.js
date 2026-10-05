import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api, { getErrorMessage } from '../../../services/api';
import styles from './CheckoutPage.module.css';

const CheckoutPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [cartItems, setCartItems] = useState([]);
  const [checkoutError, setCheckoutError] = useState('');
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

  const paymentMethod = 'cod';

  useEffect(() => {
    // Get design data from location state (passed from PreviewPage)
    const stateData = location.state?.designData;
    const stateProduct = location.state?.product;
    const orderDetails = location.state?.orderDetails;

    if (
      stateData?.originalImage &&
      stateData?.uploadedImage &&
      stateProduct?.id &&
      orderDetails?.size &&
      orderDetails?.colour &&
      Number.isInteger(orderDetails?.quantity) &&
      orderDetails.quantity > 0
    ) {
      setCheckoutError('');
      setCartItems([{
        product: stateProduct,
        productName: stateProduct.name,
        designData: stateData,
        quantity: orderDetails.quantity,
        size: orderDetails.size,
        colour: orderDetails.colour,
        price: Number(stateProduct.price)
      }]);
    } else {
      setCartItems([]);
      setCheckoutError('Checkout needs a selected product, size, colour, quantity, and completed design. Return to a product page to start again.');
    }
  }, [location.state]);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateAddress = () => {
    return formData.fullName && formData.email && formData.phone && 
           formData.address && formData.city && formData.state && formData.pincode;
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
      setStep('review');
      return;
    }

    if (step === 'review') {
      setIsProcessing(true);

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
            productId: item.product?._id || item.product?.id,
            productName: item.productName,
            productPrice: item.price,
            productCode: item.product?.productCode || null,
            size: item.size,
            colour: item.colour,
            designTemplate: item.designData?.template || 'centered',
            originalImage: item.designData?.originalImage || '',
            previewImage: item.designData?.previewImage || '',
            uploadedImage: item.designData?.uploadedImage || '',
            position: item.designData?.position || {},
            quantity: item.quantity,
            totalPrice: (item.price * item.quantity).toFixed(2),
            paymentMethod
          };

          const { data } = await api.post('/api/orders', orderPayload);
          lastOrderId = data?.orderId || null;
        }

        localStorage.removeItem('customCart');
        localStorage.removeItem('checkoutItems');
        localStorage.removeItem('cartItems');

        if (lastOrderId) {
          navigate(`/order-success/${lastOrderId}`);
        } else {
          navigate('/');
        }
      } catch (error) {
        alert(`Error saving order: ${getErrorMessage(error, 'Failed to save order.')}`);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const calculateTotal = () => {
    return cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  if (checkoutError) {
    return (
      <div className={styles.checkoutPage}>
        <div className={styles.checkoutContainer}>
          <div className={styles.formSection}>
            <h2>Unable to continue to checkout</h2>
            <p role="alert">{checkoutError}</p>
            <button className={styles.placeOrderBtn} onClick={() => navigate('/category/all')}>
              Browse Products
            </button>
          </div>
        </div>
      </div>
    );
  }

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
                <h2>Payment</h2>
                <div className={styles.codInfo}>
                  <div className={styles.codIcon}>Cash</div>
                  <p>Cash on Delivery is selected. No online payment is collected on this website.</p>
                </div>
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
                  <h3>Payment</h3>
                  <p className={styles.reviewText}>Cash on Delivery. Online payment is not collected.</p>
                </div>

                <div className={styles.reviewSection}>
                  <h3>Items</h3>
                  {cartItems.map((item, idx) => (
                    <div key={idx} className={styles.reviewItem}>
                      <span>
                        {item.productName} — {item.size}, {item.colour} (x{item.quantity})
                      </span>
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
                    <span>{item.productName} ({item.size}, {item.colour})</span>
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
                  else navigate(`/product/${cartItems[0]?.product?.id || ''}`);
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
