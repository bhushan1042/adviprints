import React, { useEffect, useState, useRef } from 'react';
import './ImageCarousel.css';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000';

const IconPrev = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
);
const IconNext = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
);

const useIsTouch = () => {
  const [t, setT] = useState(false);
  useEffect(() => setT(typeof window !== 'undefined' && ('ontouchstart' in window || (navigator && navigator.maxTouchPoints && navigator.maxTouchPoints > 0))), []);
  return t;
};

const ImageCarousel = ({ interval = 6000 }) => {
  const [index, setIndex] = useState(0);
  const [slides, setSlides] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const timer = useRef(null);
  const trackRef = useRef(null);
  const touchStart = useRef(0);
  const isTouch = useIsTouch();

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/homepage`);
        if (!res.ok) return;
        const data = await res.json();
        const s = Array.isArray(data.bannerSlides) && data.bannerSlides.length ? data.bannerSlides : (Array.isArray(data.bannerImages) ? data.bannerImages.map((u,i)=>({ imageUrl: u, caption:'', ctaText:'', ctaUrl:'', order:i })) : []);
        if (!mounted) return;
        setSlides(s);
        setLoaded(true);
      } catch (err) { console.error('Failed to fetch homepage', err); }
    })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    start();
    return stop;
  }, [index, slides, isTouch]);

  const start = () => {
    stop();
    if (!slides || slides.length <= 1) return;
    if (isTouch) return;
    timer.current = setTimeout(() => setIndex(i => (i + 1) % slides.length), interval);
  };
  const stop = () => { if (timer.current) { clearTimeout(timer.current); timer.current = null; } };

  const prev = () => setIndex(i => (i - 1 + slides.length) % slides.length);
  const next = () => setIndex(i => (i + 1) % slides.length);
  const goTo = (i) => setIndex(i % slides.length);

  const getImage = (url) => {
    if (!url) return '';
    if (typeof url !== 'string') return '';
    if (url.startsWith('http') || url.startsWith('data:')) return url;
    if (url.startsWith('/')) return API_BASE + url;
    return API_BASE + '/' + url;
  };

  const onTouchStart = (e) => { touchStart.current = e.touches[0].clientX; };
  const onTouchEnd = (e) => {
    const delta = (e.changedTouches[0].clientX - touchStart.current);
    if (delta > 40) prev(); else if (delta < -40) next();
  };

  const slidesData = slides && slides.length ? slides : [];

  return (
    <section id="home" className="hero-carousel" aria-roledescription="carousel">
      <div className="hero-track" ref={trackRef} style={{ transform: `translateX(-${index * 100}%)` }} onMouseEnter={stop} onMouseLeave={start} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        {slidesData.map((s, i) => (
          <div className={`hero-slide ${i === index ? 'active' : ''}`} key={i} role="group" aria-roledescription="slide" aria-label={`Slide ${i+1} of ${slidesData.length}`}>
            <div className="hero-bg" style={{ backgroundImage: `url(${getImage(s.imageUrl)})` }} />

            <div className="hero-banner">
              <img className="hero-inline-img" src={getImage(s.imageUrl)} alt={s.caption || `Slide ${i+1}`} />
            </div>

          </div>
        ))}
      </div>

      {/* controls */}
      <button className="hero-arrow left" aria-label="Previous" onClick={prev}><span className="arrow-inner"><IconPrev/></span></button>
      <button className="hero-arrow right" aria-label="Next" onClick={next}><span className="arrow-inner"><IconNext/></span></button>

      {/* indicators */}
      <div className="hero-indicators">
        {slidesData.map((_, i) => (
          <button key={i} className={`hero-pill ${i === index ? 'active' : ''}`} onClick={() => goTo(i)} aria-label={`Go to slide ${i+1}`} />
        ))}
      </div>
    </section>
  );
};

export default ImageCarousel;
