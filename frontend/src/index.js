import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles/theme.css";
import { fetchBranding } from './utils/branding';

// fetch branding early and apply favicon
;(async () => {
  try {
    const b = await fetchBranding();
    const favicon = b && (b.favicon || b.mainLogo) ? (b.favicon || b.mainLogo) : null;
    if (favicon) {
      const link = document.createElement('link');
      link.rel = 'icon';
      link.href = (favicon.startsWith('http') ? favicon : (process.env.REACT_APP_API_BASE || 'http://localhost:5000') + favicon);
      document.head.appendChild(link);
    }
  } catch (e) { /* ignore */ }
})();

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
