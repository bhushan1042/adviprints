import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api, { getErrorMessage, isRequestAborted } from '../../../services/api';
import { applyImageFallback, resolveImageUrl } from '../../../utils/images';
import categoryPlaceholder from '../../../assets/placeholders/category-placeholder.png';
import styles from './OrderSuccess.module.css';

const OrderSuccess = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    let ignore = false;

    const fetchOrder = async () => {
      try {
        setLoading(true);
        const { data } = await api.get(`/api/orders/${id}`, { signal: controller.signal });

        if (!ignore) {
          setOrder(data);
          setError(null);
        }
      } catch (requestError) {
        if (!ignore && !isRequestAborted(requestError)) {
          setError(getErrorMessage(requestError, 'Order not found'));
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    if (id) {
      fetchOrder();
    }

    return () => {
      ignore = true;
      controller.abort();
    };
  }, [id]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const addressLines = useMemo(() => {
    if (!order?.address) {
      return [];
    }

    const cityState = [order.address.city, order.address.state].filter(Boolean).join(', ');
    return [cityState, order.address.country].filter(Boolean);
  }, [order]);

  if (loading) {
    return (
      <div className={styles.pageContainer}>
        <div className={styles.loadingBox}>
          <div className={styles.spinner}></div>
          <p>Loading your order...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.pageContainer}>
        <div className={styles.errorBox}>
          <h2>Order Not Found</h2>
          <p>{error}</p>
          <button onClick={() => navigate('/')} className={styles.homeBtn}>
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className={styles.pageContainer}>
        <div className={styles.errorBox}>
          <p>No order details available</p>
          <button onClick={() => navigate('/')} className={styles.homeBtn}>
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      <div className={styles.successContainer}>
        <div className={styles.successHeader}>
          <div className={styles.checkmark}>?</div>
          <h1>Order Confirmed!</h1>
          <p>Thank you for your order</p>
        </div>

        <div className={styles.orderIdCard}>
          <div className={styles.label}>Order ID</div>
          <div className={styles.orderId}>{order._id.substring(0, 12)}...</div>
          <div className={styles.details}>
            <span>Placed on {formatDate(order.createdAt)}</span>
            <span>•</span>
            <span className={styles.status}>{order.status.toUpperCase()}</span>
          </div>
        </div>

        <div className={styles.contentGrid}>
          {order.originalImagePath ? (
            <div className={styles.designSection}>
              <h3>Your Design</h3>
              <div className={styles.imageContainer}>
                <img
                  src={resolveImageUrl(order.originalImagePath, categoryPlaceholder)}
                  alt="Design"
                  className={styles.designImage}
                  width="640"
                  height="640"
                  style={{ aspectRatio: '1 / 1', objectFit: 'contain' }}
                  onError={(event) => applyImageFallback(event, categoryPlaceholder)}
                />
              </div>
              <div className={styles.designInfo}>
                <p><strong>Template:</strong> {order.designTemplate === 'centered' ? 'Centered Print' : 'Chest Pocket'}</p>
                <p><strong>Position:</strong> X: {Math.round(order.position?.x || 0)}, Y: {Math.round(order.position?.y || 0)}</p>
              </div>
            </div>
          ) : null}

          <div className={styles.detailsSection}>
            <div className={styles.detailCard}>
              <h3>Product Details</h3>
              <div className={styles.detailRow}>
                <span className={styles.label}>Product</span>
                <span className={styles.value}>{order.productName || 'Custom T-Shirt'}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.label}>Price</span>
                <span className={styles.value}>?{Number(order.productPrice || 0).toFixed(2)}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.label}>Quantity</span>
                <span className={styles.value}>{order.quantity || 1}</span>
              </div>
              <div className={styles.divider} />
              <div className={styles.detailRow}>
                <span className={styles.label}>Total</span>
                <span className={`${styles.value} ${styles.total}`}>?{Number(order.totalPrice || 0).toFixed(2)}</span>
              </div>
              {!order.originalImagePath ? (
                <div className={styles.designInfo}>
                  <p><strong>Template:</strong> {order.designTemplate === 'centered' ? 'Centered Print' : 'Chest Pocket'}</p>
                  <p><strong>Position:</strong> X: {Math.round(order.position?.x || 0)}, Y: {Math.round(order.position?.y || 0)}</p>
                </div>
              ) : null}
            </div>

            <div className={styles.detailCard}>
              <h3>Delivery Address</h3>
              <address className={styles.address}>
                {order.customerName}<br />
                {addressLines.map((line) => (
                  <React.Fragment key={line}>
                    {line}<br />
                  </React.Fragment>
                ))}
              </address>
              <div className={styles.divider} />
              <div className={styles.contactInfo}>
                <p>Email: {order.customerEmail}</p>
                <p>Phone: {order.customerPhone}</p>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.timelineSection}>
          <h3>Order Timeline</h3>
          <div className={styles.timeline}>
            <div className={styles.timelineItem}>
              <div className={styles.timelineDot} />
              <div className={styles.timelineContent}>
                <p className={styles.timelineLabel}>Order Placed</p>
                <p className={styles.timelineDate}>{formatDate(order.createdAt)}</p>
              </div>
            </div>
            <div className={`${styles.timelineItem} ${order.status !== 'pending' ? styles.active : ''}`}>
              <div className={styles.timelineDot} />
              <div className={styles.timelineContent}>
                <p className={styles.timelineLabel}>Processing</p>
                <p className={styles.timelineDate}>In progress</p>
              </div>
            </div>
            <div className={`${styles.timelineItem} ${['completed'].includes(order.status) ? styles.active : ''}`}>
              <div className={styles.timelineDot} />
              <div className={styles.timelineContent}>
                <p className={styles.timelineLabel}>Shipped</p>
                <p className={styles.timelineDate}>Coming soon</p>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.actions}>
          <button className={styles.primaryBtn} onClick={() => navigate('/')}>
            Continue Shopping
          </button>
          <button className={styles.secondaryBtn} onClick={() => window.print()}>
            Print Receipt
          </button>
        </div>

        <div className={styles.message}>
          <p>A confirmation email has been sent to <strong>{order.customerEmail}</strong></p>
          <p>You will receive tracking updates via SMS and Email</p>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccess;
