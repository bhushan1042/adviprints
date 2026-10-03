import React, { useEffect, useState } from 'react';
import { useNavigate, Outlet } from 'react-router-dom';
import styles from './AdminDashboard.module.css';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if admin is authenticated
    const token = localStorage.getItem('adminToken');
    const adminEmail = localStorage.getItem('adminEmail');

    if (!token) {
      navigate('/admin/login');
      return;
    }

    setEmail(adminEmail || '');
    setIsLoading(false);
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminEmail');
    navigate('/admin/login');
  };

  const handleNavigation = (path) => {
    navigate(path);
  };

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className={styles.dashboardContainer}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <h2>Admin Panel</h2>
          <p className={styles.userEmail}>{email}</p>
        </div>

        <nav className={styles.sidebarNav}>
          <button
            className={styles.navItem}
            onClick={() => handleNavigation('/admin/dashboard')}
          >
            📊 Dashboard
          </button>
          <button
            className={styles.navItem}
            onClick={() => handleNavigation('/admin/orders')}
          >
            📦 Custom Orders
          </button>
          <button
            className={styles.navItem}
            onClick={() => handleNavigation('/admin/branding')}
          >
            🎨 Branding
          </button>
        </nav>

        <div className={styles.sidebarFooter}>
          <button className={styles.logoutBtn} onClick={handleLogout}>
            🚪 Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={styles.mainContent}>
        <div className={styles.contentArea}>
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
