import React, { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Footer from '../../../components/layout/Footer';
import api, { getErrorMessage, isRequestAborted } from '../../../services/api';
import { applyImageFallback, resolveImageUrl } from '../../../utils/images';
import categoryPlaceholder from '../../../assets/placeholders/category-placeholder.png';
import styles from './ProductPage.module.css';

const TemplateSelector = lazy(() => import('../../design/components/TemplateSelector'));
const DesignEditor = lazy(() => import('../../design/components/DesignEditor'));
const PreviewPage = lazy(() => import('../../design/components/PreviewPage'));

const ProductPage = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeImage, setActiveImage] = useState(0);
  const [qty, setQty] = useState(1);
  const [selectedColour, setSelectedColour] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [showDesc, setShowDesc] = useState(true);
  const [related, setRelated] = useState([]);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [designStep, setDesignStep] = useState(null);
  const [designData, setDesignData] = useState(null);
  const galleryRef = useRef(null);
  const relatedRef = useRef(null);
  const addBtnRef = useRef(null);

  const shortDescription = product?.description
    ? `${product.description.split('. ')[0]}.`
    : 'Premium customizable print ready in vibrant color and fast dispatch.';

  const changeQty = (delta) => setQty((current) => Math.max(1, current + delta));

  const scrollRelated = (offset) => {
    relatedRef.current?.scrollBy({ left: offset, behavior: 'smooth' });
  };

  useEffect(() => {
    const controller = new AbortController();
    let ignore = false;

    const loadProduct = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data } = await api.get(`/products/${id}`, { signal: controller.signal });
        const images = [data?.imageUrl, data?.image, ...(Array.isArray(data?.images) ? data.images : [])]
          .map((image) => resolveImageUrl(image, categoryPlaceholder))
          .filter(Boolean);
        const uniqueImages = [...new Set(images.length ? images : [categoryPlaceholder])];

        if (!ignore) {
          setProduct({ ...data, _images: uniqueImages });
          setSelectedColour((data?.colours && data.colours[0]) || null);
          setSelectedSize((data?.sizes && data.sizes[0]) || null);
          setActiveImage(0);
        }
      } catch (requestError) {
        if (!ignore && !isRequestAborted(requestError)) {
          setError(getErrorMessage(requestError, 'Product not found'));
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    loadProduct();

    return () => {
      ignore = true;
      controller.abort();
    };
  }, [id]);

  useEffect(() => {
    if (!product) {
      return undefined;
    }

    const controller = new AbortController();
    let ignore = false;

    const loadRelatedProducts = async () => {
      try {
        if (!product.categoryId && !product.category) {
          if (!ignore) {
            setRelated([]);
          }
          return;
        }

        const categoryId = product.categoryId || '';
        const endpoint = categoryId ? `/categories/${categoryId}/products` : '/products';
        const { data } = await api.get(endpoint, { signal: controller.signal });
        const list = Array.isArray(data) ? data : [];

        if (!ignore) {
          setRelated(
            list
              .filter((item) => item._id !== product._id)
              .slice(0, 8)
              .map((item) => ({
                ...item,
                imageUrl: resolveImageUrl(item.imageUrl || item.image, categoryPlaceholder),
              }))
          );
        }
      } catch (requestError) {
        if (!ignore && !isRequestAborted(requestError)) {
          setRelated([]);
        }
      }
    };

    loadRelatedProducts();

    return () => {
      ignore = true;
      controller.abort();
    };
  }, [product]);

  useEffect(() => {
    const elements = document.querySelectorAll('[data-reveal]');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add(styles.revealed);
        }
      });
    }, { threshold: 0.12 });

    elements.forEach((element) => observer.observe(element));

    return () => observer.disconnect();
  }, [loading]);

  const createRipple = (event) => {
    const button = addBtnRef.current;

    if (!button) {
      return;
    }

    const rect = button.getBoundingClientRect();
    const ripple = document.createElement('span');
    const size = Math.max(rect.width, rect.height);
    ripple.className = styles.ripple;
    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${event.clientX - rect.left - size / 2}px`;
    ripple.style.top = `${event.clientY - rect.top - size / 2}px`;
    button.appendChild(ripple);
    window.setTimeout(() => ripple.remove(), 600);
  };

  if (loading) {
    return <div className={styles.loader}>Loading…</div>;
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  if (!product) {
    return <div className={styles.error}>Product not found</div>;
  }

  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.badgeRow}>
            {product.discount && <div className={styles.discountBadge}>-{product.discount}%</div>}
            <div className={styles.pretitle}>Custom Apparel</div>
          </div>
          <h1 className={styles.title}>{product.name}</h1>
        </div>
      </header>

      <main className={styles.container}>
        <section className={styles.grid}>
          <div className={`${styles.gallery} panel`} data-reveal>
            <div className={styles.mainImage} ref={galleryRef}>
              <img
                src={product._images[activeImage]}
                alt={product.name}
                className={styles.mainImg}
                width="640"
                height="640"
                style={{ aspectRatio: '1 / 1', objectFit: 'contain' }}
                onError={(event) => applyImageFallback(event, categoryPlaceholder)}
                onMouseEnter={() => galleryRef.current?.classList.add(styles.zoomActive)}
                onMouseLeave={() => galleryRef.current?.classList.remove(styles.zoomActive)}
                draggable={false}
              />
            </div>

            <div className={styles.thumbs} role="tablist" aria-label="Product thumbnails">
              {product._images.map((src, index) => (
                <button
                  key={`${src}-${index}`}
                  className={`${styles.thumbBtn} ${index === activeImage ? styles.thumbActive : ''}`}
                  onClick={() => setActiveImage(index)}
                  aria-pressed={index === activeImage}
                >
                  <img
                    src={src}
                    alt={`${product.name} ${index + 1}`}
                    className={styles.thumbImg}
                    width="96"
                    height="96"
                    style={{ aspectRatio: '1 / 1', objectFit: 'cover' }}
                    onError={(event) => applyImageFallback(event, categoryPlaceholder)}
                    draggable={false}
                  />
                </button>
              ))}
            </div>
          </div>

          <aside className={`${styles.details} panel`} data-reveal>
            <nav className={styles.breadcrumbs}><Link to="/">Home</Link> <span>/</span> <Link to={`/category/${product.categoryId || ''}`}>{product.category || 'Category'}</Link> <span>/</span> <span>{product.name}</span></nav>

            <h2 className={styles.productTitle}>{product.name}</h2>

            <div className={styles.metaRow}>
              <div className={styles.priceWrap}>
                {product.originalPrice && <div className={styles.original}>${Number(product.originalPrice).toFixed(2)}</div>}
                <div className={styles.price}>${Number(product.price || 0).toFixed(2)}</div>
              </div>
            </div>

            <p className={styles.shortDescription}>{shortDescription}</p>

            <div className={styles.variants}>
              {product.colours && product.colours.length > 0 && (
                <div className={styles.variantGroup}>
                  <div className={styles.variantLabel}>Colour</div>
                  <div className={styles.colourList}>
                    {product.colours.map((colour, index) => (
                      <button
                        key={`${colour}-${index}`}
                        onClick={() => setSelectedColour(colour)}
                        className={`${styles.colourSwatch} ${selectedColour === colour ? styles.colourSelected : ''}`}
                        style={{ background: colour }}
                        aria-label={`Choose colour ${colour}`}
                      />
                    ))}
                  </div>
                </div>
              )}

              {product.sizes && product.sizes.length > 0 && (
                <div className={styles.variantGroup}>
                  <div className={styles.variantLabel}>Size</div>
                  <div className={styles.sizeList}>
                    {product.sizes.map((size, index) => (
                      <button
                        key={`${size}-${index}`}
                        onClick={() => setSelectedSize(size)}
                        className={`${styles.sizeBtn} ${selectedSize === size ? styles.sizeSelected : ''}`}
                        aria-pressed={selectedSize === size}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className={styles.buyRow}>
              <div className={styles.qty}>
                <span className={styles.muted}>Qty</span>
                <div className={styles.quantityControl}>
                  <button type="button" className={styles.qtyButton} onClick={() => changeQty(-1)} aria-label="Decrease quantity">-</button>
                  <div className={styles.qtyValue}>{qty}</div>
                  <button type="button" className={styles.qtyButton} onClick={() => changeQty(1)} aria-label="Increase quantity">+</button>
                </div>
              </div>

              <div className={styles.ctaColumn}>
                <button
                  type="button"
                  className={`${styles.btn} ${styles.primaryBtn}`}
                  onClick={() => setShowTemplateSelector(true)}
                >
                  <span className={styles.btnIcon}>?</span>
                  <span className={styles.btnText}>Customize Now</span>
                </button>

                <button
                  ref={addBtnRef}
                  type="button"
                  className={`${styles.btn} ${styles.secondaryBtn}`}
                  onMouseDown={createRipple}
                  onClick={() => {}}
                >
                  <span className={styles.btnIcon}>??</span>
                  <span className={styles.btnText}>Add to Cart</span>
                </button>
              </div>
            </div>

            <div className={styles.accordion}>
              <button className={styles.accordionToggle} onClick={() => setShowDesc((current) => !current)} aria-expanded={showDesc}>
                <span>Product description</span>
                <span className={styles.accordionIcon}>{showDesc ? '-' : '+'}</span>
              </button>
              <div className={`${styles.accordionBody} ${showDesc ? styles.open : ''}`}>
                <p className={styles.description}>{product.description || 'No description available.'}</p>
                <ul className={styles.bulletList}>
                  <li>Premium fabric with comfortable fit</li>
                  <li>High-quality embroidery &amp; print options</li>
                  <li>Available in multiple sizes and colours</li>
                </ul>
              </div>
            </div>
          </aside>
        </section>

        <section className={`${styles.related} panel`} data-reveal>
          <div className={styles.relatedHeader}>
            <h3>Related products</h3>
            <div className={styles.carouselNav}>
              <button type="button" className={styles.carouselBtn} onClick={() => scrollRelated(-320)} aria-label="Scroll related items left">?</button>
              <button type="button" className={styles.carouselBtn} onClick={() => scrollRelated(320)} aria-label="Scroll related items right">?</button>
            </div>
          </div>
          <div className={styles.carouselShell}>
            <div className={styles.carousel} ref={relatedRef} role="list">
              {related.length ? related.map((item) => (
                <Link key={item._id} to={`/product/${item._id}`} className={styles.relatedCard} role="listitem">
                  <div className={styles.relatedMedia}>
                    <img
                      src={resolveImageUrl(item.imageUrl, categoryPlaceholder)}
                      alt={item.name}
                      width="240"
                      height="240"
                      style={{ aspectRatio: '1 / 1', objectFit: 'contain' }}
                      onError={(event) => applyImageFallback(event, categoryPlaceholder)}
                    />
                  </div>
                  <div className={styles.relatedBody}>
                    <div className={styles.relatedName}>{item.name}</div>
                    <div className={styles.relatedPrice}>${Number(item.price || 0).toFixed(2)}</div>
                  </div>
                </Link>
              )) : <div className={styles.muted}>No related items found.</div>}
            </div>
            <div className={styles.fadeEdge} aria-hidden="true" />
            <div className={styles.fadeEdgeRight} aria-hidden="true" />
          </div>
        </section>
        <Footer />
      </main>

      <Suspense fallback={<div className={styles.loader}>Loading editor…</div>}>
        {showTemplateSelector && (
          <TemplateSelector
            selectedTemplate={selectedTemplate}
            onSelectTemplate={setSelectedTemplate}
            onConfirm={() => {
              setShowTemplateSelector(false);
              setDesignStep('editor');
            }}
            onCancel={() => {
              setShowTemplateSelector(false);
              setSelectedTemplate(null);
            }}
          />
        )}

        {designStep === 'editor' && selectedTemplate && (
          <DesignEditor
            selectedTemplate={selectedTemplate}
            onSave={(data) => {
              setDesignData(data);
              setDesignStep('preview');
            }}
            onCancel={() => {
              setDesignStep(null);
              setSelectedTemplate(null);
              setDesignData(null);
            }}
          />
        )}

        {designStep === 'preview' && designData && (
          <PreviewPage
            product={product}
            designData={designData}
            onEdit={() => setDesignStep('editor')}
            onClose={() => {
              setDesignStep(null);
              setSelectedTemplate(null);
              setDesignData(null);
            }}
          />
        )}
      </Suspense>
    </div>
  );
};

export default ProductPage;
