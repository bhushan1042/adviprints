import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Footer from '../../../components/layout/Footer';
import api, { getErrorMessage, isRequestAborted } from '../../../services/api';
import { applyImageFallback, resolveImageUrl } from '../../../utils/images';
import categoryPlaceholder from '../../../assets/placeholders/category-placeholder.png';
import '../../home/pages/Homepage.css';
import './CategoryPage.css';

const CategoryPage = () => {
  const { id } = useParams();
  const [category, setCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    let ignore = false;

    const loadCategory = async () => {
      setLoading(true);
      setError(null);

      try {
        const [categoryResponse, productsResponse] = await Promise.all([
          api.get(`/categories/${encodeURIComponent(id)}`, { signal: controller.signal }),
          api.get(`/categories/${encodeURIComponent(id)}/products`, { signal: controller.signal }),
        ]);

        if (ignore) {
          return;
        }

        setCategory(categoryResponse.data);
        setProducts(
          (productsResponse.data || []).map((product) => ({
            ...product,
            imageUrl: resolveImageUrl(product.imageUrl || product.image, categoryPlaceholder),
          }))
        );
      } catch (requestError) {
        if (!ignore && !isRequestAborted(requestError)) {
          setError(getErrorMessage(requestError, 'Failed to load this category.'));
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    loadCategory();

    return () => {
      ignore = true;
      controller.abort();
    };
  }, [id]);

  if (loading) {
    return <div className="page-loader">Loading...</div>;
  }

  if (error) {
    return <div className="page-error">{error}</div>;
  }

  if (!category) {
    return <div className="page-error">Category not found</div>;
  }

  const heroImage = resolveImageUrl(category.bannerImageUrl || category.imageUrl || category.image, categoryPlaceholder);

  return (
    <div className="category-page">
      <section className="hero-carousel category-hero" aria-label={`${category.name} hero`}>
        <div className="hero-track">
          <div className="hero-slide active">
            <div className="hero-bg" style={{ backgroundImage: `url(${heroImage})` }} />
            <div className="hero-banner">
              <img
                className="hero-inline-img"
                src={heroImage}
                alt={category.name}
                width="1400"
                height="550"
                style={{ aspectRatio: '1400 / 550', objectFit: 'contain' }}
                onError={(event) => applyImageFallback(event, categoryPlaceholder)}
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
                <p>Browse {products.length} premium items that are ready for customization.</p>
              </div>
              <div className="category-badge">{products.length} Products</div>
            </div>

            <div className="products-grid">
              {products.map((product) => {
                const productId = product._id || product.id;

                return (
                  <div key={productId} className="collection-product-card">
                    <Link to={`/product/${productId}`} className="collection-product-image">
                      <img
                        src={resolveImageUrl(product.imageUrl || product.image, categoryPlaceholder)}
                        alt={product.name}
                        width="320"
                        height="320"
                        style={{ aspectRatio: '1 / 1', objectFit: 'contain' }}
                        onError={(event) => applyImageFallback(event, categoryPlaceholder)}
                      />
                    </Link>
                    <div className="collection-product-content">
                      <Link to={`/product/${productId}`} className="collection-product-title">
                        {product.name}
                      </Link>
                      {product.description ? <p className="muted">{product.description}</p> : null}
                      <div className="collection-product-price-row">
                        <div className="collection-product-price">
                          {product.originalPrice && Number(product.originalPrice) > Number(product.price) ? (
                            <span className="collection-product-original-price">?{Number(product.originalPrice).toFixed(2)}</span>
                          ) : null}
                          <span className={product.originalPrice && Number(product.originalPrice) > Number(product.price) ? 'current sale' : 'current'}>
                            ?{typeof product.price === 'number' ? product.price.toFixed(2) : product.price}
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
