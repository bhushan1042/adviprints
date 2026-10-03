import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { getErrorMessage, isRequestAborted, withAuth } from '../../../services/api';
import styles from './AdminOrdersList.module.css';

const AdminOrdersList = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');

  const fetchOrders = useCallback(async (signal) => {
    try {
      setLoading(true);
      const { data } = await api.get('/api/orders', withAuth({ signal }));
      setOrders(Array.isArray(data) ? data : []);
      setError(null);
    } catch (requestError) {
      if (!isRequestAborted(requestError)) {
        setError(getErrorMessage(requestError, 'Failed to fetch orders.'));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchOrders(controller.signal);
    return () => controller.abort();
  }, [fetchOrders]);

  const filteredOrders = filter === 'all' ? orders : orders.filter((order) => order.status === filter);

  const handleViewOrder = (orderId) => {
    navigate(`/admin/orders/${orderId}`);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (status) => {
    const statusMap = {
      pending: '#fbbf24',
      processing: '#60a5fa',
      completed: '#10b981',
      cancelled: '#ef5350',
    };
    return statusMap[status] || '#6b7280';
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.header}>
        <h1>Custom Orders Management</h1>
        <button onClick={() => fetchOrders()} className={styles.refreshBtn}>
          Refresh
        </button>
      </div>

      <div className={styles.filters}>
        {['all', 'pending', 'processing', 'completed', 'cancelled'].map((status) => (
          <button
            key={status}
            className={`${styles.filterBtn} ${filter === status ? styles.active : ''}`}
            onClick={() => setFilter(status)}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {error && <div className={styles.errorBox}>?? {error}</div>}

      {loading ? (
        <div className={styles.loadingBox}>Loading orders...</div>
      ) : filteredOrders.length === 0 ? (
        <div className={styles.emptyBox}>
          <p>No orders found</p>
        </div>
      ) : (
        <div className={styles.ordersTable}>
          <div className={styles.tableHeader}>
            <div className={styles.col1}>Order ID</div>
            <div className={styles.col2}>Customer</div>
            <div className={styles.col3}>Product</div>
            <div className={styles.col4}>Date</div>
            <div className={styles.col5}>Status</div>
            <div className={styles.col6}>Action</div>
          </div>

          {filteredOrders.map((order) => (
            <div key={order._id} className={styles.tableRow}>
              <div className={styles.col1}>
                <code>{order._id.substring(0, 8)}...</code>
              </div>
              <div className={styles.col2}>
                <div className={styles.customerInfo}>
                  <strong>{order.customerName}</strong>
                  <small>{order.customerEmail}</small>
                </div>
              </div>
              <div className={styles.col3}>{order.productName || 'Custom T-Shirt'}</div>
              <div className={styles.col4}>{formatDate(order.createdAt)}</div>
              <div className={styles.col5}>
                <span className={styles.statusBadge} style={{ backgroundColor: getStatusColor(order.status) }}>
                  {order.status.toUpperCase()}
                </span>
              </div>
              <div className={styles.col6}>
                <button className={styles.viewBtn} onClick={() => handleViewOrder(order._id)}>
                  View
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className={styles.footerInfo}>
        <p>Total Orders: {orders.length} | Showing: {filteredOrders.length}</p>
      </div>
    </div>
  );
};

export default AdminOrdersList;
