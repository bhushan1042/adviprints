import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Footer from '../components/Footer';
import '../pages/Homepage.css';
import './CategoryPage.css';
import categoryPlaceholder from '../images/categories_placeholder/placeholder.png';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000';

const CategoryPage = () => {
  const { id } = useParams();
  const [category, setCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const resolveImageUrl = (imageUrl) => {
    if (!imageUrl) return categoryPlaceholder;
    if (typeof imageUrl !== 'string') return categoryPlaceholder;
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) return imageUrl;
    if (imageUrl.startsWith('/')) return API_BASE + imageUrl;
    return imageUrl;
  };

  useEffect(() => {
    let mounted = true;
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [catRes, prodRes] = await Promise.all([
          fetch(`${API_BASE}/categories/${encodeURIComponent(id)}`),
          fetch(`${API_BASE}/categories/${encodeURIComponent(id)}/products`),
        ]);

        if (!catRes.ok) throw new Error('Category not found');
        if (!prodRes.ok) throw new Error('Products not found');

        const cat = await catRes.json();
        const prods = await prodRes.json();

        if (!mounted) return;
        setCategory(cat);
        setProducts(prods.map((p) => ({ ...p, imageUrl: resolveImageUrl(p.imageUrl || p.image) })));
      } catch (err) {
        console.error(err);
        if (mounted) setError(err.message || 'Failed to load');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchData();
    return () => {
      mounted = false;
    };
  }, [id]);

  if (loading) return <div className="page-loader">Loading...</div>;
  if (error) return <div className="page-error">{error}</div>;
  if (!category) return <div className="page-error">Category not found</div>;

  return (
    <div className="category-page">
      <section className="hero-carousel category-hero" aria-label={`${category.name} hero`}>
        <div className="hero-track">
          <div className="hero-slide active">
            <div
              className="hero-bg"
              style={{ backgroundImage: `url(${resolveImageUrl(category.bannerImageUrl || category.imageUrl || category.image)})` }}
            />
            <div className="hero-banner">
              <img
                className="hero-inline-img"
                src={resolveImageUrl(category.bannerImageUrl || category.imageUrl || category.image)}
                alt={category.name}
              />
            </div>
          </div>
        </div>
      </section>

      <main className="container">
        <section className="category-products-section">
          <div className="inner">
            <div className="category-products-header">
              <div>
                <h2>{category.name}</h2>
                <p>
                  Browse {products.length} premium items that are ready for customization.
                </p>
              </div>
              <div className="category-badge">{products.length} Products</div>
            </div>

            <div className="products-grid">
              {products.map((p) => {
                const productId = p._id || p.id;
                return (
                  <div key={productId} className="collection-product-card">
                    <Link to={`/product/${productId}`} className="collection-product-image">
                      <img src={resolveImageUrl(p.imageUrl || p.image)} alt={p.name} />
                    </Link>
                    <div className="collection-product-content">
                      <Link to={`/product/${productId}`} className="collection-product-title">
                        {p.name}
                      </Link>
                      {p.description ? <p className="muted">{p.description}</p> : null}
                      <div className="collection-product-price-row">
                        <div className="collection-product-price">
                          {p.originalPrice && Number(p.originalPrice) > Number(p.price) ? (
                            <span className="collection-product-original-price">₹{Number(p.originalPrice).toFixed(2)}</span>
                          ) : null}
                          <span className={p.originalPrice && Number(p.originalPrice) > Number(p.price) ? 'current sale' : 'current'}>
                            ₹{typeof p.price === 'number' ? p.price.toFixed(2) : p.price}
                          </span>
                        </div>
                        <Link to={`/product/${productId}`} className="collection-product-button">
                          Customize
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default CategoryPage;
