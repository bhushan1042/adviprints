import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { clearAdminSession, getErrorMessage } from '../../../services/api';
import styles from './AdminLogin.module.css';

const AdminLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLogin = async (event) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { data } = await api.post('/login-submit', { email, password });

      if (data?.role !== 'admin') {
        clearAdminSession();
        setError('You do not have admin access.');
        return;
      }

      localStorage.setItem('adminToken', data.token);
      localStorage.setItem('adminEmail', email);
      setEmail('');
      setPassword('');
      navigate('/admin/dashboard');
    } catch (requestError) {
      clearAdminSession();
      setError(getErrorMessage(requestError, 'Login failed.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.loginBox}>
        <div className={styles.header}>
          <h1>Admin Panel</h1>
          <p>Sign in to manage orders</p>
        </div>

        {error && (
          <div className={styles.errorMessage}>
            <span>??</span>
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleLogin} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="admin@example.com"
              required
              disabled={loading}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              required
              disabled={loading}
            />
          </div>

          <button type="submit" className={styles.loginBtn} disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className={styles.footer}>
          <p>Use your registered admin credentials to log in</p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
