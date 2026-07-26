import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import ImageCarousel from '../components/ImageCarousel';
import ProductCard from '../components/ProductCard';
import './Homepage.css';
import categoryPlaceholder from '../images/categories_placeholder/placeholder.png';
import tshirtMock from '../images/tshirt-template.jpg';
import mugMock from '../images/uploads/1769265853030-IMG_20240707_184449.jpg';
import ProductShowcase from '../components/ProductShowcase';
import HowItWorks from '../components/HowItWorks';
import FaqSection from '../components/FaqSection';
import Footer from '../components/Footer';
import iconCustomize from '../images/SVGs/customize.svg';
import iconDelivery from '../images/SVGs/delevery.svg';
import iconSecure from '../images/SVGs/Secure.svg';
import iconQuality from '../images/SVGs/svg-1.svg';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000';

const resolveImageUrl = (imageUrl, fallback = categoryPlaceholder) => {
  if (!imageUrl) return fallback;
  if (typeof imageUrl !== 'string') return fallback;
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://') || imageUrl.startsWith('data:')) return imageUrl;
  if (imageUrl.startsWith('/')) return API_BASE + imageUrl;
  return API_BASE + '/' + imageUrl;
};

const normalizeList = (d) => {
  if (Array.isArray(d)) return d;
  if (d && Array.isArray(d.value)) return d.value;
  return [];
};

const mapCategory = (it, idx) => {
  if (!it) return { id: `c-${idx}`, name: 'Unknown', image: categoryPlaceholder };
  return {
    id: it._id || it.id || `c-${idx}`,    slug: it.slug || (it.name ? it.name.toString().trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\-]/g, '').replace(/\-+/g, '-').replace(/^-+|-+$/g, '') : ''),    name: it.name || it.title || `Category ${idx + 1}`,
    description: it.description || '',
    image: resolveImageUrl(it.imageUrl || it.bannerImageUrl || it.image),
    bannerImageUrl: it.bannerImageUrl || it.banner || null,
    showcaseTitle: it.showcaseTitle || '',
    showcaseSubtitle: it.showcaseSubtitle || '',
    showcaseFeatures: Array.isArray(it.showcaseFeatures) ? it.showcaseFeatures : (typeof it.showcaseFeatures === 'string' ? it.showcaseFeatures.split('\n').map(s=>s.trim()).filter(Boolean) : []),
    showcaseCtaText: it.showcaseCtaText || ''
  };
};

const mapProduct = (it) => {
  if (!it) return null;
  return {
    id: it._id || it.id,
    name: it.name,
    price: it.price || 0,
    image: resolveImageUrl(it.imageUrl),
    reviewCount: it.reviewCount || 0,
    averageRating: it.averageRating || 0
  };
};

const IndexPage = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterStatus, setNewsletterStatus] = useState(null);

  useEffect(() => {
    // fetch categories
    fetch(`${API_BASE}/categories`).then(async r => { const d = await r.json(); console.log('/categories raw', d); return d; }).then(d => setCategories(normalizeList(d).map(mapCategory))).catch(err => console.error(err));

    // new arrivals (removed)

    // promotions
    fetch(`${API_BASE}/promotions`).then(async r => { const d = await r.json(); console.log('/promotions raw', d); return d; }).then(d => setPromotions(normalizeList(d))).catch(err => console.error(err));

  }, []);

  // Lightweight scroll reveal for sections and key components
  useEffect(() => {
    if (typeof window === 'undefined' || !document) return;
    const selectors = ['.hero-carousel', '.why-adviprints', '#start-customizing', '.product-showcase', '.trust-grid', '.how-steps', '.faq', '.promo-strip', '.footer-inner'];
    const nodes = [];
    selectors.forEach(s => document.querySelectorAll(s).forEach(el => { el.classList.add('reveal-on-scroll'); nodes.push(el); }));

    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });

    nodes.forEach(n => observer.observe(n));
    return () => observer.disconnect();
  }, []);

  const tshirtCategory = useMemo(() => {
    return (categories || []).find(c => /t-?shirts?/i.test(c.name || ''));
  }, [categories]);

  const mugCategory = useMemo(() => {
    return (categories || []).find(c => /mugs?/i.test(c.name || ''));
  }, [categories]);

  const getCategoryPath = (category) => {
    if (!category) return '/category';
    return `/category/${encodeURIComponent(category.slug || category.id)}`;
  };

  const handleCategoryClick = (c) => navigate(getCategoryPath(c));
  const handleProductClick = (p) => navigate(`/product/${p.id}`);

  const addToCart = (product) => {
    try {
      const cart = JSON.parse(localStorage.getItem('cart') || '[]');
      cart.push({ id: product.id, name: product.name, price: product.price, qty: 1 });
      localStorage.setItem('cart', JSON.stringify(cart));
      alert('Added to cart');
    } catch (err) { console.error(err); }
  };

  const handleSubscribe = async (e) => {
    e.preventDefault();
    setNewsletterStatus('loading');
    try {
      const res = await fetch(`${API_BASE}/newsletter/subscribe`, { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ email: newsletterEmail }) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || json.message || 'Subscription failed');
      setNewsletterStatus('success');
      setNewsletterEmail('');
    } catch (err) {
      console.error(err);
      setNewsletterStatus('error');
    }
  };

  const trustCards = useMemo(() => ([
    { key: 'quality', title: 'Premium Quality', desc: 'High-grade materials and prints.' },
    { key: 'fast', title: 'Fast Delivery', desc: 'Reliable shipping across India.' },
    { key: 'secure', title: 'Secure Payment', desc: 'Multiple safe payment options.' },
    { key: 'custom', title: 'Custom Printing', desc: 'On-demand printing with care.' },
    { key: 'bulk', title: 'Bulk Orders', desc: 'Discounts for large orders.' },
    { key: 'support', title: '24x7 Support', desc: 'We’re here to help anytime.' }
  ]), []);

  return (
    <div className="homepage">
      <ImageCarousel />

      {/* Why Choose AdviPrints: placed between hero and showcases */}
      <section className="section-white why-adviprints">
        <div className="inner">
          <h2>Why Choose AdviPrints</h2>
          <div className="trust-grid four-up">
              <div className="trust-card">
                <img src={iconQuality} className="trust-icon" alt="Premium Materials" />
                <div>
                  <h3>Premium Materials</h3>
                  <p>Comfortable and durable products.</p>
                </div>
              </div>
              <div className="trust-card">
                <img src={iconCustomize} className="trust-icon" alt="High Quality Printing" />
                <div>
                  <h3>High Quality Printing</h3>
                  <p>Sharp, vibrant, long-lasting prints.</p>
                </div>
              </div>
              <div className="trust-card">
                <img src={iconDelivery} className="trust-icon" alt="Fast Delivery" />
                <div>
                  <h3>Fast Delivery</h3>
                  <p>Quick production and shipping.</p>
                </div>
              </div>
              <div className="trust-card">
                <img src={iconSecure} className="trust-icon" alt="Secure Checkout" />
                <div>
                  <h3>Secure Checkout</h3>
                  <p>Safe and reliable payment process.</p>
                </div>
              </div>
          </div>
        </div>
      </section>

      <main className="container">
        {/* Premium product showcases for the two core items */}
        <section id="start-customizing" className="section-white">
          <div className="inner">
            <ProductShowcase
              title={ (tshirtCategory && tshirtCategory.showcaseTitle) || 'Custom T-Shirt Printing' }
              subtitle={ (tshirtCategory && (tshirtCategory.showcaseSubtitle || tshirtCategory.description)) || "Premium quality custom printed t-shirts for businesses, events and personal use." }
              features={ (tshirtCategory && Array.isArray(tshirtCategory.showcaseFeatures) && tshirtCategory.showcaseFeatures.length) ? tshirtCategory.showcaseFeatures : ["Soft and comfortable fabric", "Vibrant long-lasting prints", "Multiple size options"] }
              buttonText={ (tshirtCategory && tshirtCategory.showcaseCtaText) || 'Design Your T-Shirt' }
              imageSrc={ resolveImageUrl(tshirtCategory && (tshirtCategory.image || tshirtCategory.bannerImageUrl) , tshirtMock) }
              actionRoute={getCategoryPath(tshirtCategory)}
              reverse={false}
            />

            <div style={{ height: 18 }} />

            <ProductShowcase
              title={ (mugCategory && mugCategory.showcaseTitle) || 'Custom Mug Printing' }
              subtitle={ (mugCategory && (mugCategory.showcaseSubtitle || mugCategory.description)) || "Create personalized mugs with your favorite designs and messages." }
              features={ (mugCategory && Array.isArray(mugCategory.showcaseFeatures) && mugCategory.showcaseFeatures.length) ? mugCategory.showcaseFeatures : ["Premium ceramic mugs", "High-quality printing", "Perfect for gifting"] }
              buttonText={ (mugCategory && mugCategory.showcaseCtaText) || 'Design Your Mug' }
              imageSrc={ resolveImageUrl(mugCategory && (mugCategory.image || mugCategory.bannerImageUrl), mugMock) }
              actionRoute={getCategoryPath(mugCategory)}
              reverse={true}
            />
          </div>
        </section>

        

        <HowItWorks />

        

        

        

        <FaqSection />

        {/* Reviews removed per request */}

        {/* Promotions */}
        {promotions && promotions.length ? (
          <section className="promo-strip section-white">
            <div className="inner">
              {promotions.map(p => (
                <div className="promo" key={p._id || p.title}>
                  <strong>{p.title}</strong>
                  <span>{p.description}</span>
                </div>
              ))}
            </div>
          </section>
        ) : null}

      </main>

<Footer />
    </div>
  );
};

export default IndexPage;
