import React from 'react';
import { useNavigate } from 'react-router-dom';
import './ProductShowcase.css';
import placeholder from '../images/categories_placeholder/placeholder.png';

const ProductShowcase = ({
  title,
  subtitle,
  features = [],
  buttonText = 'Design',
  imageSrc,
  alt,
  reverse = false,
  actionRoute,
  onAction
}) => {
  const navigate = useNavigate();

  const handleAction = () => {
    if (typeof onAction === 'function') return onAction();
    if (actionRoute) return navigate(actionRoute);
  };

  return (
    <div className={`product-showcase ${reverse ? 'reverse' : ''}`}>
      <div className="showcase-card" role="button" tabIndex={0} onClick={handleAction} onKeyDown={(e)=>{ if(e.key === 'Enter') handleAction(); }}>
        <div className="showcase-image">
          <img src={imageSrc || placeholder} alt={alt || title} loading="lazy" onError={(e)=>{ e.currentTarget.onerror = null; e.currentTarget.src = placeholder; }} />
        </div>

        <div className="showcase-content">
          <h3 className="showcase-title">{title}</h3>
          <p className="showcase-subtitle">{subtitle}</p>

          <ul className="showcase-features">
            {features.map((f, i) => (
              <li key={i} className="feature-item">{f}</li>
            ))}
          </ul>

          <div className="showcase-actions">
            <button className="btn-cta" onClick={(e)=>{ e.stopPropagation(); handleAction(); }}>{buttonText}</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductShowcase;
