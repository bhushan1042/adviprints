import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './PreviewPage.module.css';

const PreviewPage = ({ product, designData, onEdit, onClose }) => {
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);

  if (!designData) {
    return (
      <div className={styles.previewOverlay} onClick={onClose}>
        <div className={styles.previewContainer} onClick={e => e.stopPropagation()}>
          <p>No design data available</p>
          <button onClick={onClose}>Close</button>
        </div>
      </div>
    );
  }

  const handleProceedToCheckout = () => {
    setIsProcessing(true);
    
    // Don't save base64 images to localStorage - too large!
    // Just pass design data through React Router state
    // CheckoutPage will send it directly to backend
    
    setTimeout(() => {
      navigate('/checkout', { state: { designData, product } });
    }, 500);
  };

  return (
    <div className={styles.previewOverlay} onClick={onClose}>
      <div className={styles.previewContainer} onClick={e => e.stopPropagation()}>
        <div className={styles.previewHeader}>
          <h2>Review Your Design</h2>
          <button className={styles.closeBtn} onClick={onClose}>×</button>
        </div>

        <div className={styles.previewBody}>
          <div className={styles.previewMockup}>
            <h3>{designData.template === 'centered' ? 'Centered Print' : 'Chest Pocket'}</h3>
            <div className={styles.mockupBox}>
              {/* Display the generated preview image from Konva */}
              {designData.originalImage && (
                <img 
                  src={designData.originalImage} 
                  alt="Design Preview"
                  className={styles.designPreviewImg}
                />
              )}
            </div>
            <button className={styles.editLink} onClick={onEdit}>
              ✎ Edit Design
            </button>
          </div>

          <div className={styles.previewDetails}>
            <div className={styles.detailsCard}>
              <h3>Order Summary</h3>
              
              <div className={styles.detailRow}>
                <span>Product</span>
                <strong>{product?.name || 'Custom T-Shirt'}</strong>
              </div>

              <div className={styles.detailRow}>
                <span>Size</span>
                <strong>XL (Customizable)</strong>
              </div>

              <div className={styles.detailRow}>
                <span>Design Template</span>
                <strong>{designData.template === 'centered' ? 'Centered Print' : 'Chest Pocket'}</strong>
              </div>

              <div className={styles.detailRow}>
                <span>Design Type</span>
                <strong>Custom Print</strong>
              </div>

              <div className={styles.divider} />

              <div className={styles.detailRow} style={{ fontSize: '18px', fontWeight: '700' }}>
                <span>Price</span>
                <strong>${Number(product?.price || 19.99).toFixed(2)}</strong>
              </div>

              <div className={styles.priceNote}>
                <p>✓ Premium quality fabric</p>
                <p>✓ High-definition printing</p>
                <p>✓ Free shipping on orders $50+</p>
              </div>
            </div>

            <div className={styles.actionButtons}>
              <button 
                className={styles.btnSecondary} 
                onClick={onEdit}
              >
                ← Edit Design
              </button>
              <button 
                className={`${styles.btnPrimary} ${isProcessing ? styles.loading : ''}`}
                onClick={handleProceedToCheckout}
                disabled={isProcessing}
              >
                {isProcessing ? 'Processing...' : 'Proceed to Checkout'}
              </button>
            </div>

            <button 
              className={styles.continueShoppingBtn}
              onClick={onClose}
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreviewPage;
