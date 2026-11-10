import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Category } from '../../data/products';
import categoryPlaceholder from '../../assets/placeholders/category-placeholder.png';
import { applyImageFallback } from '../../utils/images';
import styles from './CategoryCarousel.module.css';

export default function CategoryCarousel({ categories }: { categories: Category[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canScroll, setCanScroll] = useState({ previous: false, next: false });

  const updateControls = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const remaining = track.scrollWidth - track.clientWidth - track.scrollLeft;
    setCanScroll({ previous: track.scrollLeft > 1, next: remaining > 1 });
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    updateControls();
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(updateControls) : null;
    observer?.observe(track);
    window.addEventListener('resize', updateControls);
    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', updateControls);
    };
  }, [categories, updateControls]);

  const scroll = (direction: -1 | 1) => {
    const track = trackRef.current;
    const card = track?.firstElementChild as HTMLElement | null;
    if (!track || !card) return;
    const gap = parseFloat(window.getComputedStyle(track).columnGap) || 0;
    track.scrollBy({ left: direction * (card.offsetWidth + gap), behavior: 'auto' });
  };

  if (!categories.length) return null;

  return (
    <div className={styles.carousel} role="region" aria-label="Shop by category carousel">
      <div className={styles.track} ref={trackRef} onScroll={updateControls}>
        {categories.map((category) => (
          <Link className={styles.card} key={category.id} to={`/category/${category.slug}`}>
            <div className={styles.imageWrap}>
              <img
                src={category.image}
                alt=""
                loading="lazy"
                onError={(event) => applyImageFallback(event, categoryPlaceholder)}
              />
              <span className={styles.explore} aria-hidden="true">Explore collection <ArrowRight size={15} /></span>
            </div>
            <div className={styles.caption}>
              <span>{category.name}</span>
              <ArrowRight className={styles.cardArrow} size={16} aria-hidden="true" />
            </div>
          </Link>
        ))}
      </div>
      {canScroll.previous && (
        <button className={`${styles.control} ${styles.previous}`} type="button" onClick={() => scroll(-1)} aria-label="Previous categories">
          <ChevronLeft size={20} aria-hidden="true" />
        </button>
      )}
      {canScroll.next && (
        <button className={`${styles.control} ${styles.next}`} type="button" onClick={() => scroll(1)} aria-label="Next categories">
          <ChevronRight size={20} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
