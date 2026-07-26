const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000';

let _cache = null;

export async function fetchBranding() {
  if (_cache) return _cache;
  try {
    const res = await fetch(`${API_BASE}/api/branding`);
    if (!res.ok) return {};
    const json = await res.json();
    _cache = json || {};
    // persist lightly for app startup
    try { localStorage.setItem('branding', JSON.stringify(_cache)); } catch (e) {}
    return _cache;
  } catch (err) {
    try { const stored = JSON.parse(localStorage.getItem('branding')||'null'); if (stored) return stored; } catch(e){}
    return {};
  }
}

export function getCachedBranding() { return _cache || (JSON.parse(localStorage.getItem('branding')||'null') || {}); }
