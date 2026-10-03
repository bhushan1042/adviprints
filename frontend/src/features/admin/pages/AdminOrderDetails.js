import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api, { getErrorMessage, isRequestAborted, withAuth } from '../../../services/api';
import styles from './AdminOrderDetails.module.css';

const ARTWORK_ITEMS = [
  { key: 'original', field: 'originalImagePath', label: 'Original Design' },
  { key: 'preview', field: 'previewImagePath', label: 'Final Preview' },
  { key: 'uploaded', field: 'uploadedImageData', label: 'Uploaded Image' },
];

const AdminOrderDetails = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [artworkImages, setArtworkImages] = useState({});

  useEffect(() => {
    const controller = new AbortController();
    let ignore = false;

    const fetchOrder = async () => {
      try {
        setLoading(true);
        const { data } = await api.get(`/api/orders/${orderId}`, withAuth({ signal: controller.signal }));

        if (!ignore) {
          setOrder(data);
          setNewStatus(data.status);
          setError(null);
        }
      } catch (requestError) {
        if (!ignore && !isRequestAborted(requestError)) {
          setError(getErrorMessage(requestError, 'Failed to fetch order.'));
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    fetchOrder();

    return () => {
      ignore = true;
      controller.abort();
    };
  }, [orderId]);

  const artworkEntries = useMemo(() => ARTWORK_ITEMS.filter((item) => Boolean(order?.[item.field])), [order]);

  useEffect(() => {
    if (!order || artworkEntries.length === 0) {
      setArtworkImages({});
      return undefined;
    }

    const controller = new AbortController();
    let ignore = false;
    const objectUrls = [];

    const loadArtwork = async () => {
      const nextImages = {};

      await Promise.all(
        artworkEntries.map(async ({ key }) => {
          try {
            const { data } = await api.get(
              `/api/orders/${orderId}/artwork/${key}`,
              withAuth({ signal: controller.signal, responseType: 'blob' })
            );

            if (ignore) {
              return;
            }

            const objectUrl = URL.createObjectURL(data);
            objectUrls.push(objectUrl);
            nextImages[key] = { src: objectUrl, error: false };
          } catch (requestError) {
            if (!isRequestAborted(requestError)) {
              nextImages[key] = { src: '', error: true };
            }
          }
        })
      );

      if (!ignore) {
        setArtworkImages(nextImages);
      }
    };

    loadArtwork();

    return () => {
      ignore = true;
      controller.abort();
      objectUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [artworkEntries, order, orderId]);

  const handleStatusUpdate = async () => {
    if (!order || newStatus === order.status) {
      return;
    }

    try {
      setIsSaving(true);
      const { data } = await api.put(`/api/orders/${orderId}`, { status: newStatus }, withAuth());
      setOrder(data);
      setNewStatus(data.status);
      alert('Order status updated successfully');
    } catch (requestError) {
      alert(`Error: ${getErrorMessage(requestError, 'Failed to update order status.')}`);
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className={styles.pageContainer}>
        <div className={styles.loadingBox}>Loading order details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.pageContainer}>
        <div className={styles.errorBox}>?? {error}</div>
        <button className={styles.backBtn} onClick={() => navigate('/admin/orders')}>
          Back to Orders
        </button>
      </div>
    );
  }

  if (!order) {
    return (
      <div className={styles.pageContainer}>
        <div className={styles.emptyBox}>Order not found</div>
        <button className={styles.backBtn} onClick={() => navigate('/admin/orders')}>
          Back to Orders
        </button>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      <button className={styles.backBtn} onClick={() => navigate('/admin/orders')}>
        Back to Orders
      </button>

      <div className={styles.detailsGrid}>
        <div className={styles.orderHeader}>
          <div>
            <h1>Order #{order._id.substring(0, 8)}</h1>
            <p className={styles.date}>{formatDate(order.createdAt)}</p>
          </div>
          <div className={styles.statusSection}>
            <label htmlFor="statusSelect">Status:</label>
            <select
              id="statusSelect"
              value={newStatus}
              onChange={(event) => setNewStatus(event.target.value)}
              className={styles.statusSelect}
            >
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            {newStatus !== order.status && (
              <button className={styles.updateBtn} onClick={handleStatusUpdate} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Update'}
              </button>
            )}
          </div>
        </div>

        <div className={styles.card}>
          <h3>Customer Information</h3>
          <div className={styles.infoGrid}>
            <div className={styles.infoRow}>
              <label>Name</label>
              <p>{order.customerName}</p>
            </div>
            <div className={styles.infoRow}>
              <label>Email</label>
              <p>{order.customerEmail}</p>
            </div>
            <div className={styles.infoRow}>
              <label>Phone</label>
              <p>{order.customerPhone}</p>
            </div>
            <div className={styles.infoRow}>
              <label>Payment Method</label>
              <p>{order.paymentMethod?.toUpperCase() || 'N/A'}</p>
            </div>
          </div>

          <div className={styles.addressSection}>
            <h4>Shipping Address</h4>
            <address>
              {order.address?.street && <p>{order.address.street}</p>}
              {order.address?.city && <p>{order.address.city}, {order.address.state} {order.address.zipCode}</p>}
              {order.address?.country && <p>{order.address.country}</p>}
            </address>
          </div>
        </div>

        <div className={styles.card}>
          <h3>Product Details</h3>
          <div className={styles.infoGrid}>
            <div className={styles.infoRow}>
              <label>Product</label>
              <p>{order.productName || 'Custom T-Shirt'}</p>
            </div>
            <div className={styles.infoRow}>
              <label>Price</label>
              <p>${Number(order.productPrice || 0).toFixed(2)}</p>
            </div>
            <div className={styles.infoRow}>
              <label>Quantity</label>
              <p>{order.quantity || 1}</p>
            </div>
            <div className={styles.infoRow}>
              <label>Total Price</label>
              <p className={styles.totalPrice}>${Number(order.totalPrice || 0).toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className={styles.card}>
          <h3>Design Template</h3>
          <div className={styles.infoGrid}>
            <div className={styles.infoRow}>
              <label>Template Type</label>
              <p>{order.designTemplate === 'centered' ? 'Centered Print' : 'Chest Pocket'}</p>
            </div>
            <div className={styles.infoRow}>
              <label>Design Position</label>
              <p>X: {order.position?.x}, Y: {order.position?.y}</p>
            </div>
            <div className={styles.infoRow}>
              <label>Scale</label>
              <p>X: {Number(order.position?.scaleX || 1).toFixed(2)}, Y: {Number(order.position?.scaleY || 1).toFixed(2)}</p>
            </div>
            <div className={styles.infoRow}>
              <label>Rotation</label>
              <p>{Number(order.position?.rotation || 0).toFixed(0)}°</p>
            </div>
          </div>
        </div>

        {artworkEntries.length > 0 && (
          <div className={`${styles.card} ${styles.imagesCard}`}>
            <h3>Design Previews</h3>
            <div className={styles.imagesGrid}>
              {artworkEntries.map(({ key, label }) => {
                const artwork = artworkImages[key];

                return (
                  <div className={styles.imageBox} key={key}>
                    <label>{label}</label>
                    {artwork?.src ? (
                      <img src={artwork.src} alt={label} width="320" height="320" style={{ aspectRatio: '1 / 1', objectFit: 'contain' }} />
                    ) : artwork?.error ? (
                      <small>Image unavailable</small>
                    ) : (
                      <small>Loading image...</small>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className={styles.card}>
          <h3>Order Timeline</h3>
          <div className={styles.timeline}>
            <div className={styles.timelineItem}>
              <div className={styles.timelineDot} />
              <div className={styles.timelineContent}>
                <p className={styles.timelineLabel}>Order Created</p>
                <p className={styles.timelineDate}>{formatDate(order.createdAt)}</p>
              </div>
            </div>
            {order.updatedAt && order.updatedAt !== order.createdAt && (
              <div className={styles.timelineItem}>
                <div className={styles.timelineDot} />
                <div className={styles.timelineContent}>
                  <p className={styles.timelineLabel}>Last Updated</p>
                  <p className={styles.timelineDate}>{formatDate(order.updatedAt)}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOrderDetails;
