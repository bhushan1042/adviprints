import React, { useEffect, useRef, useState } from 'react';
import api, { isRequestAborted } from '../../services/api';
import { applyImageFallback, resolveImageUrl } from '../../utils/images';
import categoryPlaceholder from '../../assets/placeholders/category-placeholder.png';
import './ImageCarousel.css';

const IconPrev = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
);
const IconNext = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
);

const useIsTouch = () => {
  const [touchDevice, setTouchDevice] = useState(false);

  useEffect(() => {
    setTouchDevice(
      typeof window !== 'undefined' &&
        ('ontouchstart' in window || (navigator && navigator.maxTouchPoints && navigator.maxTouchPoints > 0))
    );
  }, []);

  return touchDevice;
};

const ImageCarousel = ({ interval = 6000 }) => {
  const [index, setIndex] = useState(0);
  const [slides, setSlides] = useState([]);
  const timer = useRef(null);
  const touchStart = useRef(0);
  const isTouch = useIsTouch();

  useEffect(() => {
    const controller = new AbortController();
    let ignore = false;

    const loadSlides = async () => {
      try {
        const { data } = await api.get('/homepage', { signal: controller.signal });
        const nextSlides = Array.isArray(data?.bannerSlides) && data.bannerSlides.length
          ? data.bannerSlides
          : Array.isArray(data?.bannerImages)
            ? data.bannerImages.map((imageUrl, order) => ({ imageUrl, caption: '', ctaText: '', ctaUrl: '', order }))
            : [];

        if (!ignore) {
          setSlides(nextSlides);
        }
      } catch (error) {
        if (!ignore && !isRequestAborted(error)) {
          setSlides([]);
        }
      }
    };

    loadSlides();

    return () => {
      ignore = true;
      controller.abort();
    };
  }, []);

  useEffect(() => {
    const stop = () => {
      if (timer.current) {
        window.clearTimeout(timer.current);
        timer.current = null;
      }
    };

    stop();

    if (!slides.length || slides.length <= 1 || isTouch) {
      return stop;
    }

    timer.current = window.setTimeout(() => {
      setIndex((current) => (current + 1) % slides.length);
    }, interval);

    return stop;
  }, [index, interval, isTouch, slides]);

  const prev = () => setIndex((current) => (current - 1 + slides.length) % slides.length);
  const next = () => setIndex((current) => (current + 1) % slides.length);
  const goTo = (nextIndex) => setIndex(nextIndex % slides.length);

  const onTouchStart = (event) => {
    touchStart.current = event.touches[0].clientX;
  };

  const onTouchEnd = (event) => {
    const delta = event.changedTouches[0].clientX - touchStart.current;

    if (delta > 40) {
      prev();
    } else if (delta < -40) {
      next();
    }
  };

  const slidesData = slides.length ? slides : [];

  return (
    <section id="home" className="hero-carousel" aria-roledescription="carousel">
      <div
        className="hero-track"
        style={{ transform: `translateX(-${index * 100}%)` }}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {slidesData.map((slide, slideIndex) => {
          const imageUrl = resolveImageUrl(slide?.imageUrl, categoryPlaceholder);

          return (
            <div
              className={`hero-slide ${slideIndex === index ? 'active' : ''}`}
              key={slideIndex}
              role="group"
              aria-roledescription="slide"
              aria-label={`Slide ${slideIndex + 1} of ${slidesData.length}`}
            >
              <div className="hero-bg" style={{ backgroundImage: `url(${imageUrl})` }} />
              <div className="hero-banner">
                <img
                  className="hero-inline-img"
                  src={imageUrl}
                  alt={slide?.caption || `Slide ${slideIndex + 1}`}
                  width="1400"
                  height="550"
                  style={{ aspectRatio: '1400 / 550' }}
                  onError={(event) => applyImageFallback(event, categoryPlaceholder)}
                />
              </div>
            </div>
          );
        })}
      </div>

      <button className="hero-arrow left" aria-label="Previous" onClick={prev} disabled={slidesData.length <= 1}>
        <span className="arrow-inner"><IconPrev /></span>
      </button>
      <button className="hero-arrow right" aria-label="Next" onClick={next} disabled={slidesData.length <= 1}>
        <span className="arrow-inner"><IconNext /></span>
      </button>

      <div className="hero-indicators">
        {slidesData.map((_, slideIndex) => (
          <button
            key={slideIndex}
            className={`hero-pill ${slideIndex === index ? 'active' : ''}`}
            onClick={() => goTo(slideIndex)}
            aria-label={`Go to slide ${slideIndex + 1}`}
          />
        ))}
      </div>
    </section>
  );
};

export default ImageCarousel;
