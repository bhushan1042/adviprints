import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import styles from './ProductPage.module.css';
import Footer from '../components/Footer';
import TemplateSelector from './TemplateSelector';
import DesignEditor from './DesignEditor';
import PreviewPage from './PreviewPage';
import categoryPlaceholder from '../images/categories_placeholder/placeholder.png';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000';

const resolveImageUrl = (imageUrl) => {
  if (!imageUrl) return categoryPlaceholder;
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) return imageUrl;
  if (imageUrl.startsWith('/')) return API_BASE + imageUrl;
  return imageUrl;
};

const Star = ({ filled }) => <svg className={styles.star} viewBox="0 0 20 20" aria-hidden><path d="M10 1.5l2.56 5.19 5.74.83-4.15 4.05.98 5.71L10 15.77 4.87 17.28l.98-5.71L1.7 7.52l5.74-.83L10 1.5z" fill={filled ? '#ffb400' : 'rgba(0,0,0,0.12)'} /></svg>;

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

  const shortDescription = product?.description
    ? product.description.split('. ')[0] + '.'
    : 'Premium customizable print ready in vibrant color and fast dispatch.';

  const changeQty = (delta) => setQty((current) => Math.max(1, current + delta));
  const [showDesignEditor, setShowDesignEditor] = useState(false);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [designStep, setDesignStep] = useState(null); // null, 'editor', 'preview'
  const [designData, setDesignData] = useState(null);
  const galleryRef = useRef(null);
  const relatedRef = useRef(null);
  const addBtnRef = useRef(null);

  const scrollRelated = (offset) => {
    relatedRef.current?.scrollBy({ left: offset, behavior: 'smooth' });
  };

  useEffect(() => {
    let mounted = true;
    const fetchProduct = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE}/products/${id}`);
        if (!res.ok) throw new Error('Product not found');
        const p = await res.json();
        if (!mounted) return;
        const imgs = [];
        if (p.imageUrl) imgs.push(resolveImageUrl(p.imageUrl));
        if (p.image) imgs.push(resolveImageUrl(p.image));
        if (Array.isArray(p.images)) imgs.push(...p.images.map(resolveImageUrl));
        if (imgs.length === 0) imgs.push(resolveImageUrl(null));
        setProduct({ ...p, _images: imgs });
        setSelectedColour((p.colours && p.colours[0]) || null);
        setSelectedSize((p.sizes && p.sizes[0]) || null);
      } catch (err) {
        console.error(err);
        if (mounted) setError(err.message || 'Failed to load');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchProduct();
    return () => (mounted = false);
  }, [id]);

  useEffect(() => {
    if (!product) return;
    let mounted = true;
    (async () => {
      try {
        if (!product.categoryId && !product.category) return;
        const catId = product.categoryId || '';
        const res = catId ? await fetch(`${API_BASE}/categories/${catId}/products`) : await fetch(`${API_BASE}/products`);
        if (!res.ok) return;
        const list = await res.json();
        if (!mounted) return;
        setRelated(list.filter(p => p._id !== product._id).slice(0, 8).map(p => ({ ...p, imageUrl: resolveImageUrl(p.imageUrl || p.image) })));
      } catch (err) {
        // ignore quietly
      }
    })();
    return () => (mounted = false);
  }, [product]);

  useEffect(() => {
    const elems = document.querySelectorAll('[data-reveal]');
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) e.target.classList.add(styles.revealed);
      });
    }, { threshold: 0.12 });
    elems.forEach(el => io.observe(el));
    return () => io.disconnect();
  }, [loading]);

  const createRipple = (e) => {
    const btn = addBtnRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const ripple = document.createElement('span');
    ripple.className = styles.ripple;
    const size = Math.max(rect.width, rect.height);
    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
    ripple.style.top = `${e.clientY - rect.top - size / 2}px`;
    btn.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  };

  if (loading) return <div className={styles.loader}>Loading…</div>;
  if (error) return <div className={styles.error}>{error}</div>;
  if (!product) return <div className={styles.error}>Product not found</div>;

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
                onMouseEnter={() => galleryRef.current?.classList.add(styles.zoomActive)}
                onMouseLeave={() => galleryRef.current?.classList.remove(styles.zoomActive)}
                draggable={false}
              />
            </div>

            <div className={styles.thumbs} role="tablist" aria-label="Product thumbnails">
              {product._images.map((src, idx) => (
                <button
                  key={idx}
                  className={`${styles.thumbBtn} ${idx === activeImage ? styles.thumbActive : ''}`}
                  onClick={() => setActiveImage(idx)}
                  aria-pressed={idx === activeImage}
                >
                  <img src={src} alt={`${product.name} ${idx + 1}`} className={styles.thumbImg} draggable={false} />
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
                    {product.colours.map((c, i) => (
                      <button
                        key={i}
                        onClick={() => setSelectedColour(c)}
                        className={`${styles.colourSwatch} ${selectedColour === c ? styles.colourSelected : ''}`}
                        style={{ background: c }}
                        aria-label={`Choose colour ${c}`}
                      />
                    ))}
                  </div>
                </div>
              )}

              {product.sizes && product.sizes.length > 0 && (
                <div className={styles.variantGroup}>
                  <div className={styles.variantLabel}>Size</div>
                  <div className={styles.sizeList}>
                    {product.sizes.map((s, i) => (
                      <button
                        key={i}
                        onClick={() => setSelectedSize(s)}
                        className={`${styles.sizeBtn} ${selectedSize === s ? styles.sizeSelected : ''}`}
                        aria-pressed={selectedSize === s}
                      >
                        {s}
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
                  <button type="button" className={styles.qtyButton} onClick={() => changeQty(-1)} aria-label="Decrease quantity">−</button>
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
                  <span className={styles.btnIcon}>✨</span>
                  <span className={styles.btnText}>Customize Now</span>
                </button>

                <button
                  type="button"
                  className={`${styles.btn} ${styles.secondaryBtn}`}
                  onMouseDown={createRipple}
                  onClick={() => { /* keep existing add-to-cart behavior placeholder */ }}
                >
                  <span className={styles.btnIcon}>🛒</span>
                  <span className={styles.btnText}>Add to Cart</span>
                </button>
              </div>
            </div>

            <div className={styles.accordion}>
              <button className={styles.accordionToggle} onClick={() => setShowDesc(s => !s)} aria-expanded={showDesc}>
                <span>Product description</span>
                <span className={styles.accordionIcon}>{showDesc ? '−' : '+'}</span>
              </button>
              <div className={`${styles.accordionBody} ${showDesc ? styles.open : ''}`}>
                <p className={styles.description}>{product.description || 'No description available.'}</p>
                <ul className={styles.bulletList}>
                  <li>Premium fabric with comfortable fit</li>
                  <li>High-quality embroidery & print options</li>
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
              <button type="button" className={styles.carouselBtn} onClick={() => scrollRelated(-320)} aria-label="Scroll related items left">←</button>
              <button type="button" className={styles.carouselBtn} onClick={() => scrollRelated(320)} aria-label="Scroll related items right">→</button>
            </div>
          </div>
          <div className={styles.carouselShell}>
            <div className={styles.carousel} ref={relatedRef} role="list">
              {related && related.length ? related.map((r) => (
                <Link key={r._id} to={`/product/${r._id}`} className={styles.relatedCard} role="listitem">
                  <div className={styles.relatedMedia}><img src={r.imageUrl} alt={r.name} /></div>
                  <div className={styles.relatedBody}>
                    <div className={styles.relatedName}>{r.name}</div>
                    <div className={styles.relatedPrice}>${Number(r.price || 0).toFixed(2)}</div>
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
    </div>
  );
};

export default ProductPage;
