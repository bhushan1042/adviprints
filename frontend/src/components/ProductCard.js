import React from 'react';

const Stars = ({ value = 0 }) => {
  const full = Math.floor(value);
  return (
    <div className="stars" aria-hidden>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} className={`star ${i < full ? 'filled' : ''}`} viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden>
          <path d="M12 .587l3.668 7.431L24 9.748l-6 5.843L19.335 24 12 19.897 4.665 24 6 15.591 0 9.748l8.332-1.73z" />
        </svg>
      ))}
    </div>
  );
};

const ProductCard = ({ product, onCustomize, onAddToCart }) => {
  const price = product.price || 0;
  const oldPrice = product.oldPrice || product.previousPrice || null;
  const isOnSale = !!oldPrice && oldPrice > price;

  return (
    <article className="pod-card product-card" tabIndex={0} aria-label={product.name}>
      <div className="media">
        {isOnSale && <div className="badge">SALE</div>}
        <button className="wish" aria-label="Add to wishlist">❤</button>
        <div className="img-wrap">
          <img src={product.image} alt={product.name} loading="lazy" />
        </div>
      </div>

      <div className="body">
        <h3 className="title">{product.name}</h3>
        <div className="meta">
          <Stars value={product.averageRating || 0} />
          <span className="reviews">({product.reviewCount || 0})</span>
        </div>

        <div className="price-row">
          <div className="price">
            <span className="current">₹{price.toFixed(2)}</span>
            {isOnSale && <span className="old">₹{Number(oldPrice).toFixed(2)}</span>}
          </div>
          <div className="actions">
            <button className="btn customize" onClick={onCustomize}>Customize</button>
            <button className="btn add" onClick={onAddToCart}>Add</button>
          </div>
        </div>
      </div>
    </article>
  );
};

export default ProductCard;
