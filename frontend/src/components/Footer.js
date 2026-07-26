import React, { useEffect, useState } from 'react';
import { fetchBranding } from '../utils/branding';
import './Footer.css';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000';

const Footer = () => {
  const [branding, setBranding] = useState({});

  useEffect(() => {
    let mounted = true;
    fetchBranding()
      .then((data) => {
        if (mounted) {
          setBranding(data || {});
        }
      })
      .catch(() => {});

    return () => {
      mounted = false;
    };
  }, []);

  const logoPath = branding.footerLogo || branding.mainLogo;
  const logoUrl = logoPath
    ? logoPath.startsWith('http')
      ? logoPath
      : API_BASE + logoPath
    : null;

  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-grid">
          <div className="footer-brand">
            <div className="brand-identity">
              {logoUrl ? (
                <img src={logoUrl} alt="Adviprints" />
              ) : (
                <h3 style={{ color: '#fff' }}>Adviprints</h3>
              )}
            </div>
            <div className="brand-copy">
              <div className="brand-tag">Custom T-Shirts & Personalized Mugs</div>
              <p className="brand-desc">Premium custom printing with quality you can trust.</p>
            </div>
            <div className="social-icons">
              <a href="https://www.instagram.com/adviprints" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="2" width="20" height="20" rx="5" stroke="currentColor" strokeWidth="1.2"/><path d="M16 11.999a4 4 0 1 1-8 0 4 4 0 0 1 8 0z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/><path d="M18.5 6.5h.01" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </a>
              <a href="https://www.facebook.com/adviprints" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M18 2h-3a4 4 0 0 0-4 4v3H8v4h3v8h4v-8h3l1-4h-4V6a1 1 0 0 1 1-1h3V2z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </a>
              <a href="https://twitter.com/adviprints" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53A4.48 4.48 0 0 0 12 7v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </a>
            </div>
          </div>

          <div className="footer-links">
            <h4>Quick Links</h4>
            <ul>
              <li><a href="/">Home</a></li>
              <li><a href="/products">Shop</a></li>
              <li><a href="#faq">FAQ</a></li>
              <li><a href="/contact">Contact Us</a></li>
            </ul>
          </div>

          <div className="footer-contact">
            <h4>Contact</h4>
            <div className="contact-item">
              <div className="contact-label">Email</div>
              <a className="contact-value" href="mailto:support@adviprints.com">support@adviprints.com</a>
            </div>
            <div className="contact-item">
              <div className="contact-label">Phone</div>
              <a className="contact-value" href="tel:+911234567890">+91 12345 67890</a>
            </div>
            <div className="contact-item">
              <div className="contact-label">WhatsApp</div>
              <a className="wa-pill" href="https://wa.me/911234567890" aria-label="WhatsApp">Message Us</a>
            </div>
          </div>
        </div>

        <div className="footer-divider" />
        <div className="footer-bottom">
          <div>© 2025 Adviprints. All Rights Reserved.</div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
