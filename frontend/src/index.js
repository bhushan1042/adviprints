import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './app/App';
import './styles/theme.css';
import { fetchBranding } from './utils/branding';
import { resolveImageUrl } from './utils/images';

(async () => {
  try {
    const branding = await fetchBranding();
    const faviconUrl = resolveImageUrl(branding?.favicon || branding?.mainLogo, '');

    if (faviconUrl) {
      let faviconLink = document.querySelector("link[rel='icon']");

      if (!faviconLink) {
        faviconLink = document.createElement('link');
        faviconLink.rel = 'icon';
        document.head.appendChild(faviconLink);
      }

      faviconLink.href = faviconUrl;
    }
  } catch (error) {
    // Ignore favicon failures.
  }
})();

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
