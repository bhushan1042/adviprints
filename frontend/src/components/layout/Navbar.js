import React, { useEffect, useState } from 'react';
import './Navbar.css';
import { fetchBranding } from '../../utils/branding';
import { applyImageFallback, resolveImageUrl } from '../../utils/images';
import categoryPlaceholder from '../../assets/placeholders/category-placeholder.png';

const LINKS = [
  { id: 'home', label: 'Home' },
  { id: 'start-customizing', label: 'Customize' },
  { id: 'how-it-works', label: 'How It Works' },
  { id: 'contact', label: 'Contact' },
];

const Navbar = () => {
  const [active, setActive] = useState('home');
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [branding, setBranding] = useState({});
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth <= 768 : false
  );

  useEffect(() => {
    const sections = LINKS.map((link) => document.getElementById(link.id)).filter(Boolean);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActive(entry.target.id);
          }
        });
      },
      { root: null, rootMargin: '-35% 0px -50% 0px', threshold: 0 }
    );

    sections.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 24);
    };

    onScroll();
    window.addEventListener('scroll', onScroll);

    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const onResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);

      if (!mobile) {
        setOpen(false);
      }
    };

    onResize();
    window.addEventListener('resize', onResize);

    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    let ignore = false;

    fetchBranding({ signal: controller.signal })
      .then((data) => {
        if (!ignore) {
          setBranding(data || {});
        }
      })
      .catch(() => {});

    return () => {
      ignore = true;
      controller.abort();
    };
  }, []);

  const logoPath = isMobile && branding.mobileLogo ? branding.mobileLogo : branding.mainLogo;
  const logoUrl = resolveImageUrl(logoPath, '');

  return (
    <header className={`navbar premium ${scrolled ? 'scrolled' : ''}`} role="navigation" aria-label="Main Navigation">
      <div className="nav-inner">
        <div className="nav-left">
          <a className="logo" href="#home" aria-label="Homepage">
            <div className="logo-container">
              {logoUrl ? (
                <img
                  className="logo-img"
                  src={logoUrl}
                  alt="Site logo"
                  width="160"
                  height="52"
                  style={{ aspectRatio: '160 / 52', objectFit: 'contain' }}
                  onError={(event) => applyImageFallback(event, categoryPlaceholder)}
                />
              ) : (
                <>
                  <div className="logo-icon">W</div>
                  <span className="logo-text">Warner &amp; Spencer</span>
                </>
              )}
            </div>
          </a>
        </div>

        <nav className="nav-center" aria-label="Primary">
          <ul className="nav-links">
            {LINKS.map((link) => (
              <li key={link.id} className="nav-item">
                <a href={`#${link.id}`} className={`nav-link ${active === link.id ? 'active' : ''}`}>
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="nav-right">
          <a href="#start-customizing" className="nav-cta btn-cta" aria-label="Start Designing">
            Start Designing
          </a>

          <button className="nav-hamburger" aria-label="Menu" onClick={() => setOpen((current) => !current)}>
            <span className="hamburger-line" />
            <span className="hamburger-line" />
            <span className="hamburger-line" />
          </button>
        </div>
      </div>

      <div className={`mobile-menu ${open ? 'open' : ''}`}>
        <ul>
          <li>
            <a href="#start-customizing" onClick={() => setOpen(false)} className="mobile-cta">
              Start Designing
            </a>
          </li>
          {LINKS.map((link) => (
            <li key={link.id}>
              <a href={`#${link.id}`} onClick={() => setOpen(false)} className={active === link.id ? 'active' : ''}>
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </header>
  );
};

export default Navbar;
