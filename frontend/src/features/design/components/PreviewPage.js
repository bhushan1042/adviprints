import React, { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, CheckCircle2, PackageCheck, ShieldCheck, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import styles from './PreviewPage.module.css';

const PreviewPage = ({
  product,
  designData,
  selectedSize,
  selectedColour,
  quantity = 1,
  onEdit,
  onClose
}) => {
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeSide, setActiveSide] = useState(
    designData?.sidePreviews?.front ? 'front' : designData?.view || 'front'
  );
  const sides = useMemo(
    () => Object.keys(designData?.sidePreviews || {}),
    [designData?.sidePreviews]
  );

  if (!designData?.originalImage) {
    return (
      <div className={styles.previewOverlay} role="dialog" aria-modal="true" aria-label="Design preview">
        <div className={styles.previewContainer}>
          <h2>Preview unavailable</h2>
          <p>Return to the studio and try preparing your design preview again.</p>
          <button className={styles.btnPrimary} onClick={onEdit}>Back to studio</button>
        </div>
      </div>
    );
  }

  const handleProceedToCheckout = () => {
    setIsProcessing(true);
    navigate('/checkout', {
      state: {
        designData,
        product,
        orderDetails: { size: selectedSize, colour: selectedColour, quantity }
      }
    });
  };

  const preview = designData.sidePreviews?.[activeSide] || designData.originalImage;
  const total = Number(product?.price || 0) * quantity;

  return (
    <div className={styles.previewOverlay} role="dialog" aria-modal="true" aria-label="Review your T-shirt design">
      <section className={styles.previewContainer}>
        <header className={styles.previewHeader}>
          <button type="button" className={styles.backLink} onClick={onEdit}><ArrowLeft size={17} /> Back to editor</button>
          <div className={styles.previewHeading}>
            <span><CheckCircle2 size={15} /> DESIGN PREVIEW</span>
            <h1>One last look.</h1>
            <p>Review the print and product details before continuing.</p>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close preview">×</button>
        </header>

        <div className={styles.previewBody}>
          <main className={styles.previewVisual}>
            <div className={styles.previewTabs}>
              <div>
                {sides.map((side) => (
                  <button type="button" key={side} className={activeSide === side ? styles.activeSide : ''} onClick={() => setActiveSide(side)}>
                    {side === 'front' ? 'Front' : 'Back'}
                  </button>
                ))}
              </div>
              <span><Sparkles size={14} /> Print-safe artwork preview</span>
            </div>
            <div className={styles.mockupBox}>
              <img src={preview} alt={`Customized ${activeSide} of ${product?.name || 'T-shirt'}`} />
            </div>
            <div className={styles.previewConfidence}>
              <ShieldCheck size={17} />
              <span><strong>Ready for review</strong><small>Your artwork preview will be attached to the order.</small></span>
            </div>
          </main>

          <aside className={styles.previewDetails}>
            <div className={styles.detailsCard}>
              <span className={styles.cardEyebrow}>ORDER SUMMARY</span>
              <h2>{product?.name || 'Custom T-shirt'}</h2>
              <div className={styles.variantLine}>
                <span className={styles.colourSwatch} style={{ backgroundColor: selectedColour || '#f5f6f7' }} />
                <span>{selectedColour || 'Not specified'}</span><i />
                <span>Size {selectedSize || 'Not specified'}</span>
              </div>
              <div className={styles.detailRow}><span>Quantity</span><strong>{quantity}</strong></div>
              <div className={styles.detailRow}><span>Design</span><strong>{designData.template === 'blank' ? 'Original artwork' : 'Custom design'}</strong></div>
              <div className={styles.detailRow}><span>Print sides</span><strong>{sides.length || 1}</strong></div>
              <div className={styles.divider} />
              <div className={styles.priceRow}><span>Item total</span><strong>Rs {total.toFixed(2)}</strong></div>
              <p className={styles.priceNote}>Final order details will be confirmed at checkout. Online payment is not collected here.</p>
            </div>
            <div className={styles.readyCard}>
              <PackageCheck size={18} />
              <span><strong>Looks good?</strong><small>You can still return to the editor and make changes.</small></span>
            </div>
            <button type="button" className={styles.btnPrimary} onClick={handleProceedToCheckout} disabled={isProcessing}>
              {isProcessing ? 'Opening checkout…' : 'Continue to checkout'} <ArrowRight size={17} />
            </button>
            <button type="button" className={styles.btnSecondary} onClick={onEdit}><ArrowLeft size={15} /> Keep editing</button>
            <p className={styles.checkoutNote}><Check size={13} /> Product, any selected variants, quantity and design preview continue with your order.</p>
          </aside>
        </div>
      </section>
    </div>
  );
};

export default PreviewPage;
