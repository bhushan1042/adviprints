import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styles from './AdminOrderDetails.module.css';

const API_BASE = 'http://localhost:5000';

const resolveImageUrl = (imageUrl) => {
  if (!imageUrl) return null;
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) return imageUrl;
  if (imageUrl.startsWith('/uploads/')) return API_BASE + imageUrl;
  return imageUrl;
};

const AdminOrderDetails = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [newStatus, setNewStatus] = useState('');

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`http://localhost:5000/api/orders/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch order');
      const data = await response.json();
      setOrder(data);
      setNewStatus(data.status);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching order:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (newStatus === order.status) return;
    
    try {
      setIsSaving(true);
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`http://localhost:5000/api/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (!response.ok) throw new Error('Failed to update status');
      const updatedOrder = await response.json();
      setOrder(updatedOrder);
      alert('Order status updated successfully');
    } catch (err) {
      alert('Error: ' + err.message);
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
      minute: '2-digit'
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
        <div className={styles.errorBox}>
          ⚠️ {error}
        </div>
        <button className={styles.backBtn} onClick={() => navigate('/admin/orders')}>
          ← Back to Orders
        </button>
      </div>
    );
  }

  if (!order) {
    return (
      <div className={styles.pageContainer}>
        <div className={styles.emptyBox}>Order not found</div>
        <button className={styles.backBtn} onClick={() => navigate('/admin/orders')}>
          ← Back to Orders
        </button>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      <button className={styles.backBtn} onClick={() => navigate('/admin/orders')}>
        ← Back to Orders
      </button>

      <div className={styles.detailsGrid}>
        {/* Order Header */}
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
              onChange={(e) => setNewStatus(e.target.value)}
              className={styles.statusSelect}
            >
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            {newStatus !== order.status && (
              <button
                className={styles.updateBtn}
                onClick={handleStatusUpdate}
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Update'}
              </button>
            )}
          </div>
        </div>

        {/* Customer Information */}
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

        {/* Product Details */}
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

        {/* Design Details */}
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

        {/* Design Preview Images */}
        <div className={`${styles.card} ${styles.imagesCard}`}>
          <h3>Design Previews</h3>
          <div className={styles.imagesGrid}>
            {order.originalImagePath && (
              <div className={styles.imageBox}>
                <label>Original Design</label>
                <img src={resolveImageUrl(order.originalImagePath)} alt="Original Design" />
              </div>
            )}
            {order.previewImagePath && (
              <div className={styles.imageBox}>
                <label>Final Preview</label>
                <img src={resolveImageUrl(order.previewImagePath)} alt="Final Preview" />
              </div>
            )}
            {order.uploadedImageData && (
              <div className={styles.imageBox}>
                <label>Uploaded Image</label>
                <img src={resolveImageUrl(order.uploadedImageData)} alt="Uploaded Image" />
              </div>
            )}
          </div>
        </div>

        {/* Order Timeline */}
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
