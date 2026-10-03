import React, { useEffect, useState } from 'react';
import api, { getErrorMessage, isRequestAborted, withAuth } from '../../../services/api';
import { fetchBranding } from '../../../utils/branding';
import { applyImageFallback, resolveImageUrl } from '../../../utils/images';
import categoryPlaceholder from '../../../assets/placeholders/category-placeholder.png';
import styles from './AdminDashboard.module.css';

const LOGO_FIELDS = ['mainLogo', 'mobileLogo', 'favicon', 'darkLogo', 'lightLogo', 'emailLogo'];

const AdminBranding = () => {
  const [branding, setBranding] = useState({});
  const [files, setFiles] = useState({});
  const [status, setStatus] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    let ignore = false;

    fetchBranding({ signal: controller.signal, force: true })
      .then((data) => {
        if (!ignore) {
          setBranding(data || {});
        }
      })
      .catch((error) => {
        if (!ignore && !isRequestAborted(error)) {
          setMessage('Unable to load branding previews.');
        }
      });

    return () => {
      ignore = true;
      controller.abort();
    };
  }, []);

  const handleFile = (key, event) => {
    const file = event.target.files?.[0];
    setFiles((current) => ({ ...current, [key]: file }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setStatus('loading');
    setMessage('');

    try {
      const formData = new FormData();
      LOGO_FIELDS.forEach((key) => {
        if (files[key]) {
          formData.append(key, files[key]);
        }
      });

      const { data } = await api.post('/api/admin/branding', formData, withAuth());
      const refreshedBranding = await fetchBranding({ force: true });
      setStatus('success');
      setBranding(refreshedBranding || data?.branding || {});
      setMessage('Branding saved successfully.');
    } catch (requestError) {
      setStatus('error');
      setMessage(getErrorMessage(requestError, 'Failed to save branding.'));
    }
  };

  const previewUrl = (value) => resolveImageUrl(value, categoryPlaceholder);

  return (
    <div className={styles.adminSection} style={{ padding: 24 }}>
      <h2>Branding Settings � Logo Management</h2>
      <p>Upload and manage site logos. Valid types: SVG, PNG, JPG, WEBP. Max 10MB.</p>
      <form onSubmit={submit} className={styles.formGrid}>
        <div>
          <label>Main Logo (desktop)</label>
          <input type="file" accept="image/*" onChange={(event) => handleFile('mainLogo', event)} />
          {branding.mainLogo && (
            <img
              src={previewUrl(branding.mainLogo)}
              alt="main"
              width="168"
              height="56"
              style={{ height: 56, marginTop: 8, aspectRatio: '3 / 1', objectFit: 'contain' }}
              onError={(event) => applyImageFallback(event, categoryPlaceholder)}
            />
          )}
        </div>
        <div>
          <label>Mobile Logo</label>
          <input type="file" accept="image/*" onChange={(event) => handleFile('mobileLogo', event)} />
          {branding.mobileLogo && (
            <img
              src={previewUrl(branding.mobileLogo)}
              alt="mobile"
              width="144"
              height="48"
              style={{ height: 48, marginTop: 8, aspectRatio: '3 / 1', objectFit: 'contain' }}
              onError={(event) => applyImageFallback(event, categoryPlaceholder)}
            />
          )}
        </div>

        <div>
          <label>Favicon</label>
          <input type="file" accept="image/*" onChange={(event) => handleFile('favicon', event)} />
          {branding.favicon && (
            <img
              src={previewUrl(branding.favicon)}
              alt="favicon"
              width="32"
              height="32"
              style={{ height: 32, marginTop: 8, aspectRatio: '1 / 1', objectFit: 'contain' }}
              onError={(event) => applyImageFallback(event, categoryPlaceholder)}
            />
          )}
        </div>

        <div>
          <label>Dark Theme Logo</label>
          <input type="file" accept="image/*" onChange={(event) => handleFile('darkLogo', event)} />
          {branding.darkLogo && (
            <img
              src={previewUrl(branding.darkLogo)}
              alt="dark"
              width="144"
              height="48"
              style={{ height: 48, marginTop: 8, aspectRatio: '3 / 1', objectFit: 'contain' }}
              onError={(event) => applyImageFallback(event, categoryPlaceholder)}
            />
          )}
        </div>

        <div>
          <label>Light Theme Logo</label>
          <input type="file" accept="image/*" onChange={(event) => handleFile('lightLogo', event)} />
          {branding.lightLogo && (
            <img
              src={previewUrl(branding.lightLogo)}
              alt="light"
              width="144"
              height="48"
              style={{ height: 48, marginTop: 8, aspectRatio: '3 / 1', objectFit: 'contain' }}
              onError={(event) => applyImageFallback(event, categoryPlaceholder)}
            />
          )}
        </div>

        <div>
          <label>Email Logo</label>
          <input type="file" accept="image/*" onChange={(event) => handleFile('emailLogo', event)} />
          {branding.emailLogo && (
            <img
              src={previewUrl(branding.emailLogo)}
              alt="email"
              width="144"
              height="48"
              style={{ height: 48, marginTop: 8, aspectRatio: '3 / 1', objectFit: 'contain' }}
              onError={(event) => applyImageFallback(event, categoryPlaceholder)}
            />
          )}
        </div>

        <div style={{ gridColumn: '1 / -1' }}>
          <button className={styles.saveBtn} type="submit">Save Branding</button>
          {status === 'loading' && <span style={{ marginLeft: 12 }}>Uploading...</span>}
          {status === 'success' && <span style={{ marginLeft: 12, color: 'green' }}>Saved</span>}
          {status === 'error' && <span style={{ marginLeft: 12, color: 'crimson' }}>Failed</span>}
          {message ? <p style={{ marginTop: 12 }}>{message}</p> : null}
        </div>
      </form>
    </div>
  );
};

export default AdminBranding;
