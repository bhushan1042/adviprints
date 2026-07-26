import React, { useEffect, useState } from 'react';
import './Navbar.css';
import { fetchBranding } from '../utils/branding';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000';

const LINKS = [
  { id: 'home', label: 'Home' },
  { id: 'start-customizing', label: 'Customize' },
  { id: 'how-it-works', label: 'How It Works' },
  { id: 'contact', label: 'Contact' },
];

// removed individual icon buttons (search, cart, user) to focus CTA

const Navbar = () => {
  const [active, setActive] = useState('home');
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [branding, setBranding] = useState({});

  useEffect(() => {
    const sections = LINKS.map(l => document.getElementById(l.id)).filter(Boolean);
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) setActive(e.target.id);
      });
    }, { root: null, rootMargin: '-35% 0px -50% 0px', threshold: 0 });
    sections.forEach(s => obs.observe(s));
    return () => obs.disconnect();
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
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    setCartCount(Array.isArray(cart) ? cart.length : 0);
  }, []);

  useEffect(() => {
    const onResize = () => { if (window.innerWidth > 768) setOpen(false); };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    let mounted = true;
    fetchBranding().then(b => { if (mounted) setBranding(b || {}); }).catch(()=>{});
    return () => { mounted = false; };
  }, []);

  return (
    <header className={`navbar premium ${scrolled ? 'scrolled' : ''}`} role="navigation" aria-label="Main Navigation">
      <div className="nav-inner">
        <div className="nav-left">
          <a className="logo" href="#home" aria-label="Homepage">
            <div className="logo-container">
              {branding && ( (window.innerWidth <= 768 && branding.mobileLogo) || branding.mainLogo ) ? (
                <img className="logo-img" src={( (window.innerWidth <= 768 && branding.mobileLogo) ? branding.mobileLogo : branding.mainLogo ).startsWith('http') ? ( (window.innerWidth <= 768 && branding.mobileLogo) ? branding.mobileLogo : branding.mainLogo ) : (API_BASE + ( (window.innerWidth <= 768 && branding.mobileLogo) ? branding.mobileLogo : branding.mainLogo ))} alt="Site logo" />
              ) : (
                <>
                  <div className="logo-icon">W</div>
                  <span className="logo-text">Warner & Spencer</span>
                </>
              )}
            </div>
          </a>
        </div>

        <nav className="nav-center" aria-label="Primary">
          <ul className="nav-links">
            {LINKS.map(l => (
              <li key={l.id} className="nav-item">
                <a href={`#${l.id}`} className={`nav-link ${active === l.id ? 'active' : ''}`}>{l.label}</a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="nav-right">
          <a href="#start-customizing" className="nav-cta btn-cta" aria-label="Start Designing">Start Designing</a>

          <button className="nav-hamburger" aria-label="Menu" onClick={() => setOpen(o => !o)}>
            <span className="hamburger-line" />
            <span className="hamburger-line" />
            <span className="hamburger-line" />
          </button>
        </div>
      </div>

      <div className={`mobile-menu ${open ? 'open' : ''}`}>
        <ul>
          <li>
            <a href="#start-customizing" onClick={() => setOpen(false)} className="mobile-cta">Start Designing</a>
          </li>
          {LINKS.map(l => (
            <li key={l.id}><a href={`#${l.id}`} onClick={() => setOpen(false)} className={active === l.id ? 'active' : ''}>{l.label}</a></li>
          ))}
        </ul>
      </div>
    </header>
  );
};

export default Navbar;
