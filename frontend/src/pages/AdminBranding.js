import React, { useEffect, useState } from 'react';
import styles from './AdminDashboard.module.css';
import { fetchBranding } from '../utils/branding';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000';

const AdminBranding = () => {
  const [branding, setBranding] = useState({});
  const [files, setFiles] = useState({});
  const [status, setStatus] = useState(null);

  useEffect(() => {
    fetchBranding().then(b => setBranding(b || {})).catch(()=>{});
  }, []);

  const handleFile = (key, e) => {
    const f = e.target.files && e.target.files[0];
    setFiles(prev => ({ ...prev, [key]: f }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    try {
      const token = localStorage.getItem('adminToken');
      const fd = new FormData();
      ['mainLogo','mobileLogo','favicon','darkLogo','lightLogo','emailLogo'].forEach(k => {
        if (files[k]) fd.append(k, files[k]);
      });
      // also allow keeping existing urls
      const res = await fetch(`${API_BASE}/api/admin/branding`, { method: 'POST', headers: { Authorization: token ? `Bearer ${token}` : '' }, body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || json.message || 'Failed');
      setStatus('success');
      setBranding(json.branding || {});
    } catch (err) {
      console.error(err);
      setStatus('error');
    }
  };

  const previewUrl = (u) => u ? (u.startsWith('http') ? u : (API_BASE + u)) : '';

  return (
    <div className={styles.adminSection} style={{ padding:24 }}>
      <h2>Branding Settings — Logo Management</h2>
      <p>Upload and manage site logos. Valid types: SVG, PNG, JPG, WEBP. Max 10MB.</p>
      <form onSubmit={submit} className={styles.formGrid}>
        <div>
          <label>Main Logo (desktop)</label>
          <input type="file" accept="image/*" onChange={(e)=>handleFile('mainLogo', e)} />
          {branding.mainLogo && <img src={previewUrl(branding.mainLogo)} alt="main" style={{ height:56, marginTop:8 }} />}
        </div>
        <div>
          <label>Mobile Logo</label>
          <input type="file" accept="image/*" onChange={(e)=>handleFile('mobileLogo', e)} />
          {branding.mobileLogo && <img src={previewUrl(branding.mobileLogo)} alt="mobile" style={{ height:48, marginTop:8 }} />}
        </div>

        <div>
          <label>Favicon</label>
          <input type="file" accept="image/*" onChange={(e)=>handleFile('favicon', e)} />
          {branding.favicon && <img src={previewUrl(branding.favicon)} alt="favicon" style={{ height:32, marginTop:8 }} />}
        </div>

        <div>
          <label>Dark Theme Logo</label>
          <input type="file" accept="image/*" onChange={(e)=>handleFile('darkLogo', e)} />
          {branding.darkLogo && <img src={previewUrl(branding.darkLogo)} alt="dark" style={{ height:48, marginTop:8 }} />}
        </div>

        <div>
          <label>Light Theme Logo</label>
          <input type="file" accept="image/*" onChange={(e)=>handleFile('lightLogo', e)} />
          {branding.lightLogo && <img src={previewUrl(branding.lightLogo)} alt="light" style={{ height:48, marginTop:8 }} />}
        </div>

        <div>
          <label>Email Logo</label>
          <input type="file" accept="image/*" onChange={(e)=>handleFile('emailLogo', e)} />
          {branding.emailLogo && <img src={previewUrl(branding.emailLogo)} alt="email" style={{ height:48, marginTop:8 }} />}
        </div>

        <div style={{ gridColumn: '1 / -1' }}>
          <button className={styles.saveBtn} type="submit">Save Branding</button>
          {status === 'loading' && <span style={{ marginLeft:12 }}>Uploading...</span>}
          {status === 'success' && <span style={{ marginLeft:12, color:'green' }}>Saved</span>}
          {status === 'error' && <span style={{ marginLeft:12, color:'crimson' }}>Failed</span>}
        </div>
      </form>
    </div>
  );
};

export default AdminBranding;
