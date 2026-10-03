import React, { useState, useRef, useEffect } from 'react';

const PrevIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M15 18l-6-6 6-6" stroke="#111" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
);
const NextIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9 6l6 6-6 6" stroke="#111" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
);

const SectionSlider = ({ title, items = [], visible = 4, autoplay = true, interval = 3000, onItemClick }) => {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [visibleCount, setVisibleCount] = useState(visible);
  const trackRef = useRef(null);
  const windowRef = useRef(null);
  const touchStartX = useRef(0);
  const touchDeltaX = useRef(0);
  const [containerWidth, setContainerWidth] = useState(0);

  // Responsive visible count based on viewport width
  useEffect(() => {
    const compute = () => {
      const w = window.innerWidth;
      if (w >= 1200) setVisibleCount(visible);
      else if (w >= 900) setVisibleCount(Math.min(visible, 4));
      else if (w >= 600) setVisibleCount(Math.min(visible, 3));
      else if (w >= 420) setVisibleCount(Math.min(visible, 2));
      else setVisibleCount(1);
    };
    compute();
    window.addEventListener('resize', compute);
    return () => window.removeEventListener('resize', compute);
  }, [visible]);

  // measure container width for pixel-perfect transforms
  useEffect(() => {
    const measure = () => {
      if (!windowRef.current) return setContainerWidth(0);
      setContainerWidth(windowRef.current.clientWidth || 0);
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  const effectiveVisible = visibleCount;
  const effectiveMaxIndex = Math.max(0, items.length - effectiveVisible);

  // ensure index within bounds when counts change
  useEffect(() => {
    if (index > effectiveMaxIndex) setIndex(effectiveMaxIndex);
  }, [effectiveMaxIndex]);

  const prev = () => setIndex((i) => Math.max(0, i - effectiveVisible));
  const next = () => setIndex((i) => Math.min(effectiveMaxIndex, i + effectiveVisible));

  // autoplay
  useEffect(() => {
    if (!autoplay || paused || items.length <= effectiveVisible) return;
    const id = setInterval(() => {
      setIndex((i) => (i >= effectiveMaxIndex ? 0 : i + 1));
    }, interval);
    return () => clearInterval(id);
  }, [autoplay, paused, interval, effectiveMaxIndex, items.length, effectiveVisible]);

  // touch handlers for swipe
  const onTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchDeltaX.current = 0;
  };

  const onTouchMove = (e) => {
    touchDeltaX.current = e.touches[0].clientX - touchStartX.current;
  };

  const onTouchEnd = () => {
    const threshold = 40; // px
    if (touchDeltaX.current > threshold) prev();
    else if (touchDeltaX.current < -threshold) next();
    touchDeltaX.current = 0;
  };

  // keyboard navigation when focused
  const onKeyDown = (e) => {
    if (e.key === 'ArrowLeft') prev();
    if (e.key === 'ArrowRight') next();
  };

  // compute pixel widths for stable transform
  const itemWidth = containerWidth && effectiveVisible ? containerWidth / effectiveVisible : 0;
  const trackWidth = itemWidth * items.length;
  const translateX = -index * itemWidth;

  return (
    <section className="section-slider">
      <h2 className="section-title">{title}</h2>

      <div
        className="slider"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <button className="slider-control prev" onClick={prev} aria-label={`Previous ${title}`}><PrevIcon /></button>

        <div
          className="slider-window"
          ref={windowRef}
          tabIndex={0}
          onKeyDown={onKeyDown}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <div
            className="slider-track"
            ref={trackRef}
            style={{
              transform: `translateX(${translateX}px)`,
              width: trackWidth ? `${trackWidth}px` : 'auto',
            }}
          >
            {items.map((it) => (
              <div className="slider-item" key={it.id} style={{ flex: `0 0 ${100 / effectiveVisible}%`, maxWidth: itemWidth ? `${itemWidth}px` : 'none' }}>
                <img src={it.image} alt={it.title} loading="lazy" onClick={() => onItemClick && onItemClick(it)} />
                <div className="slider-caption" onClick={() => onItemClick && onItemClick(it)}>{it.title}</div>
              </div>
            ))}
          </div>
        </div>

        <button className="slider-control next" onClick={next} aria-label={`Next ${title}`}><NextIcon /></button>
      </div>
    </section>
  );
};

export default SectionSlider;
