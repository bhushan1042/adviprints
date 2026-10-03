import React from 'react';
import { useNavigate } from 'react-router-dom';
import { applyImageFallback, resolveImageUrl } from '../../utils/images';
import placeholder from '../../assets/placeholders/category-placeholder.png';
import './ProductShowcase.css';

const ProductShowcase = ({
  title,
  subtitle,
  features = [],
  buttonText = 'Design',
  imageSrc,
  alt,
  reverse = false,
  actionRoute,
  onAction,
}) => {
  const navigate = useNavigate();

  const handleAction = () => {
    if (typeof onAction === 'function') {
      return onAction();
    }

    if (actionRoute) {
      return navigate(actionRoute);
    }

    return undefined;
  };

  return (
    <div className={`product-showcase ${reverse ? 'reverse' : ''}`}>
      <div
        className="showcase-card"
        role="button"
        tabIndex={0}
        onClick={handleAction}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            handleAction();
          }
        }}
      >
        <div className="showcase-image">
          <img
            src={resolveImageUrl(imageSrc, placeholder)}
            alt={alt || title}
            loading="lazy"
            width="640"
            height="640"
            style={{ aspectRatio: '1 / 1', objectFit: 'contain' }}
            onError={(event) => applyImageFallback(event, placeholder)}
          />
        </div>

        <div className="showcase-content">
          <h3 className="showcase-title">{title}</h3>
          <p className="showcase-subtitle">{subtitle}</p>

          <ul className="showcase-features">
            {features.map((feature) => (
              <li key={feature} className="feature-item">{feature}</li>
            ))}
          </ul>

          <div className="showcase-actions">
            <button className="btn-cta" onClick={(event) => { event.stopPropagation(); handleAction(); }}>
              {buttonText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductShowcase;
