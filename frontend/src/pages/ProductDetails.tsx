import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Home as HomeIcon, Star, Share2,
  Truck, Shield, RotateCcw, Check, Minus, Plus, Palette, Ruler,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import StarRating from '@/components/ui/StarRating';
import ProductCard from '@/components/ui/ProductCard';
import SectionHeading from '@/components/ui/SectionHeading';
import { useReveal } from '@/hooks/useReveal';
import { getProduct, listCategoryProducts, listProductReviews } from '@/services/catalog';
import { getErrorMessage, isRequestAborted } from '@/services/api';
import useCatalogCategories from '@/hooks/useCatalogCategories';
import { applyImageFallback } from '@/utils/images';
import categoryPlaceholder from '@/assets/placeholders/category-placeholder.png';

const TemplateSelector = lazy(() => import('../features/design/components/TemplateSelector'));
const DesignEditor = lazy(() => import('../features/design/components/DesignEditor'));
const PreviewPage = lazy(() => import('../features/design/components/PreviewPage'));

export default function ProductDetails() {
  const { slug } = useParams<{ slug: string }>();
  const { categories } = useCatalogCategories();
  const [product, setProduct] = useState<Awaited<ReturnType<typeof getProduct>> | null>(null);
  const [related, setRelated] = useState<Awaited<ReturnType<typeof listCategoryProducts>>>([]);
  const [reviews, setReviews] = useState<Awaited<ReturnType<typeof listProductReviews>>>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [reviewsError, setReviewsError] = useState('');
  const [relatedError, setRelatedError] = useState('');
  const [activeImage, setActiveImage] = useState(0);
  const [selectedColor, setSelectedColor] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [sizeError, setSizeError] = useState(false);
  const [shareStatus, setShareStatus] = useState('');

  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [designStep, setDesignStep] = useState<'editor' | 'preview' | null>(null);
  const [designData, setDesignData] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    let ignore = false;

    setProduct(null);
    setLoading(true);
    setLoadError('');
    getProduct(slug || '', controller.signal, categories)
      .then((item) => {
        if (!ignore) {
          setProduct(item);
          setSelectedColor(0);
          setSelectedSize(null);
          setQuantity(1);
          setActiveImage(0);
        }
      })
      .catch((requestError) => {
        if (!ignore && !isRequestAborted(requestError)) {
          setLoadError(getErrorMessage(requestError, 'Unable to load this product.'));
        }
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
      controller.abort();
    };
  }, [slug, categories]);

  useEffect(() => {
    if (!product?.id) return undefined;
    const controller = new AbortController();
    let ignore = false;
    setRelated([]);
    setReviews([]);
    setRelatedError('');
    setReviewsError('');

    listCategoryProducts(product.category, categories, controller.signal)
      .then((items) => {
        if (!ignore) {
          setRelated(items.filter((item) => item.id !== product.id).slice(0, 4));
          setRelatedError('');
        }
      })
      .catch((requestError) => {
        if (!ignore && !isRequestAborted(requestError)) {
          setRelated([]);
          setRelatedError(getErrorMessage(requestError, 'Unable to load related products.'));
        }
      });

    listProductReviews(product.id, controller.signal)
      .then((items) => {
        if (!ignore) {
          setReviews(items);
          setReviewsError('');
        }
      })
      .catch((requestError) => {
        if (!ignore && !isRequestAborted(requestError)) {
          setReviewsError(getErrorMessage(requestError, 'Unable to load customer reviews.'));
        }
      });

    return () => {
      ignore = true;
      controller.abort();
    };
  }, [product, categories]);

  const discount = product?.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const selectedColour = product?.colors[selectedColor]?.name || '';

  const startCustomization = () => {
    if (!product?.sizes.length) {
      setSizeError(true);
      return;
    }
    if (!selectedSize) {
      setSizeError(true);
      return;
    }
    if (!selectedColour) {
      setSizeError(true);
      return;
    }
    setSizeError(false);
    setShowTemplateSelector(true);
  };

  const shareProduct = async () => {
    setShareStatus('');
    try {
      if (navigator.share) {
        await navigator.share({ title: product?.name, url: window.location.href });
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(window.location.href);
        setShareStatus('Product link copied.');
      } else {
        setShareStatus('Sharing is not available in this browser. Copy the page URL from the address bar.');
      }
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        setShareStatus('Unable to share this product from this browser.');
      }
    }
  };

  if (loading) {
    return <div className="container-px mx-auto max-w-7xl py-20 text-center text-navy-500">Loading product…</div>;
  }

  if (loadError || !product) {
    return (
      <div role="alert" className="container-px mx-auto max-w-7xl py-20 text-center text-error-600">
        {loadError || 'Product not found.'}
        <div className="mt-5"><Button to="/category/all" variant="outline">Browse products</Button></div>
      </div>
    );
  }

  return (
    <div className="bg-white">
      {/* breadcrumb */}
      <div className="border-b border-navy-100 bg-navy-50">
        <div className="container-px mx-auto max-w-7xl py-4">
          <nav className="flex items-center gap-2 text-sm text-navy-500">
            <Link to="/" className="flex items-center gap-1 transition-colors hover:text-orange-600">
              <HomeIcon size={14} /> Home
            </Link>
            <span>/</span>
            <Link to={`/category/${product.category}`} className="transition-colors hover:text-orange-600">
              {product.categoryName || product.category.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join(' ')}
            </Link>
            <span>/</span>
            <span className="font-medium text-navy-800">{product.name}</span>
          </nav>
        </div>
      </div>

      {/* product section */}
      <div className="container-px mx-auto max-w-7xl py-10 lg:py-14">
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
          {/* gallery */}
          <div className="flex flex-col gap-4">
            <div className="overflow-hidden rounded-3xl bg-navy-50">
              <img
                src={product.images[activeImage]}
                alt={product.name}
                className="w-full object-cover"
                onError={(event) => applyImageFallback(event, categoryPlaceholder)}
              />
            </div>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className={`overflow-hidden rounded-xl border-2 transition-all ${
                    activeImage === i ? 'border-orange-500 ring-2 ring-orange-200' : 'border-transparent hover:border-navy-200'
                  }`}
                >
                  <img src={img} alt="" className="aspect-square w-full object-cover" onError={(event) => applyImageFallback(event, categoryPlaceholder)} />
                </button>
              ))}
              <button
                type="button"
                onClick={startCustomization}
                className="flex aspect-square items-center justify-center rounded-xl border-2 border-dashed border-navy-200 text-center transition-colors hover:border-orange-400"
                aria-label="Customize this product"
              >
                <div className="px-2">
                  <Palette size={20} className="mx-auto text-orange-500" />
                  <p className="mt-1 text-[10px] font-semibold text-navy-500">Add Design</p>
                </div>
              </button>
            </div>
          </div>

          {/* info */}
          <div className="flex flex-col">
            {/* badges */}
            <div className="mb-3 flex flex-wrap gap-2">
              {product.bestseller && (
                <span className="rounded-full bg-orange-500 px-3 py-1 text-xs font-bold text-white">Bestseller</span>
              )}
              {product.isNew && (
                <span className="rounded-full bg-navy-800 px-3 py-1 text-xs font-bold text-white">New Arrival</span>
              )}
              {discount > 0 && (
                <span className="rounded-full bg-error-500 px-3 py-1 text-xs font-bold text-white">{discount}% Off</span>
              )}
            </div>

            <h1 className="font-display text-3xl font-bold leading-tight text-navy-900 sm:text-4xl">
              {product.name}
            </h1>

            <div className="mt-3 flex items-center gap-3">
              <StarRating
                rating={reviews.length ? reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / reviews.length : product.rating}
                size="md"
                showNumber
                reviewCount={reviews.length || product.reviewCount}
              />
            </div>

            {/* price */}
            <div className="mt-5 flex items-baseline gap-3">
              <span className="font-display text-3xl font-extrabold text-navy-900">
                Rs {product.price}
              </span>
              {product.originalPrice && (
                <span className="text-xl text-navy-400 line-through">
                  Rs {product.originalPrice}
                </span>
              )}
              {discount > 0 && (
                <span className="rounded-lg bg-success-100 px-2.5 py-1 text-sm font-semibold text-success-700">
                  Save Rs {(product.originalPrice || 0) - product.price}
                </span>
              )}
            </div>

            <p className="mt-5 leading-relaxed text-navy-600">{product.description}</p>

            {/* colours */}
            <div className="mt-7">
              <div className="mb-2.5 flex items-center justify-between">
                <span className="font-display text-sm font-bold text-navy-900">
                  Colour: <span className="font-normal text-navy-600">{selectedColour}</span>
                </span>
              </div>
              {product.colors.length ? (
                <div className="flex flex-wrap gap-2.5">
                  {product.colors.map((c, i) => (
                    <button
                      key={c.name}
                      onClick={() => { setSelectedColor(i); setSizeError(false); }}
                      title={c.name}
                      className={`relative h-10 w-10 rounded-full border-2 transition-all ${
                        selectedColor === i ? 'border-orange-500 ring-2 ring-orange-200' : 'border-navy-200 hover:border-navy-400'
                      }`}
                      style={{ backgroundColor: c.hex }}
                    >
                      {selectedColor === i && (
                        <Check size={16} className="absolute inset-0 m-auto text-white drop-shadow" />
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-error-600">Colour options have not been configured for this product.</p>
              )}
            </div>

            {/* sizes */}
            <div className="mt-6">
              <div className="mb-2.5 flex items-center justify-between">
                <span className="font-display text-sm font-bold text-navy-900">Size</span>
                <span className="inline-flex items-center gap-1 text-xs font-medium text-navy-500">
                  <Ruler size={13} /> Select a size
                </span>
              </div>
              {product.sizes.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((s) => (
                  <button
                    key={s}
                    onClick={() => { setSelectedSize(s); setSizeError(false); }}
                    className={`min-w-[3rem] rounded-xl border-2 px-4 py-2.5 font-display text-sm font-bold transition-all ${
                      selectedSize === s
                        ? 'border-orange-500 bg-orange-500 text-white'
                        : 'border-navy-200 text-navy-700 hover:border-orange-400'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              ) : (
                <p className="text-sm text-error-600">Size options have not been configured for this product.</p>
              )}
              {sizeError && (
                <p className="mt-2 text-sm font-medium text-error-600">
                  {!product.sizes.length
                    ? 'This product cannot be customized until sizes are configured.'
                    : !selectedColour
                      ? 'This product cannot be customized until colour options are configured.'
                      : 'Please select a size to continue.'}
                </p>
              )}
            </div>

            {/* quantity + actions */}
            <div className="mt-8 flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center rounded-xl border-2 border-navy-200">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="flex h-11 w-11 items-center justify-center text-navy-600 transition-colors hover:text-orange-600"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="w-12 text-center font-display font-bold text-navy-900">{quantity}</span>
                  <button
                    onClick={() => setQuantity((q) => Math.min(1000, q + 1))}
                    className="flex h-11 w-11 items-center justify-center text-navy-600 transition-colors hover:text-orange-600"
                  >
                    <Plus size={16} />
                  </button>
                </div>
                <Button onClick={startCustomization} size="lg" fullWidth>
                  <Palette size={20} />
                  Customize — Rs {product.price * quantity}
                </Button>
              </div>

              <div className="flex gap-3">
                <button onClick={shareProduct} className="inline-flex items-center gap-2 rounded-xl border border-navy-200 px-5 py-2.5 text-sm font-semibold text-navy-700 transition-all hover:border-orange-400 hover:text-orange-600">
                  <Share2 size={17} /> Share
                </button>
              </div>
              {shareStatus ? <p role="status" className="text-sm text-navy-500">{shareStatus}</p> : null}
            </div>

            {/* features */}
            {product.features.length > 0 ? (
              <div className="mt-8 rounded-2xl bg-navy-50 p-5">
                <h4 className="font-display text-sm font-bold text-navy-900">Product Features</h4>
                <ul className="mt-3 grid gap-2.5 sm:grid-cols-2">
                  {product.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-navy-700">
                      <Check size={16} className="mt-0.5 shrink-0 text-success-600" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {/* shipping info */}
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {[
                { icon: Truck, title: 'Delivery', desc: 'Contact support for order details' },
                { icon: RotateCcw, title: 'Order Support', desc: 'Contact us for help' },
                { icon: Shield, title: 'Product Info', desc: 'See description above' },
              ].map((item) => (
                <div key={item.title} className="flex items-center gap-2.5 rounded-xl border border-navy-100 p-3">
                  <item.icon size={20} className="shrink-0 text-orange-500" />
                  <div>
                    <p className="text-xs font-bold text-navy-900">{item.title}</p>
                    <p className="text-xs text-navy-500">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* reviews */}
      <ReviewsSection product={product} reviews={reviews} error={reviewsError} />

      {/* related */}
      {related.length > 0 && (
        <section className="bg-navy-50 py-16 lg:py-20">
          <div className="container-px mx-auto max-w-7xl">
            <SectionHeading
              eyebrow="You May Also Like"
              title="Related T-Shirts"
              subtitle="More t-shirts from the same category."
            />
            {relatedError ? <p role="alert" className="text-sm text-error-600">{relatedError}</p> : null}
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {related.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} />
              ))}
            </div>
          </div>
        </section>
      )}
      <Suspense fallback={<div className="fixed inset-0 z-[60] grid place-items-center bg-white/80 text-navy-700">Loading customization studio…</div>}>
        {showTemplateSelector && (
          <TemplateSelector
            product={product}
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
            product={product}
            selectedColour={product.colors[selectedColor]?.hex || selectedColour}
            selectedSize={selectedSize}
            initialDesign={designData}
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
            selectedSize={selectedSize}
            selectedColour={selectedColour}
            quantity={quantity}
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
}

function ReviewsSection({ product, reviews, error }: { product: NonNullable<Awaited<ReturnType<typeof getProduct>>>; reviews: Awaited<ReturnType<typeof listProductReviews>>; error: string }) {
  const { ref, visible } = useReveal();
  const distribution = useMemo(() => [5, 4, 3, 2, 1].map((stars) => {
    const count = reviews.filter((review) => Number(review.rating) === stars).length;
    return { stars, count, pct: reviews.length ? Math.round((count / reviews.length) * 100) : 0 };
  }), [reviews]);

  return (
    <section ref={ref} className={`reveal ${visible ? 'is-visible' : ''} border-t border-navy-100 bg-white py-16`}>
      <div className="container-px mx-auto max-w-7xl">
        <div className="grid gap-10 lg:grid-cols-[300px_1fr]">
          {/* summary */}
          <div className="lg:sticky lg:top-28 lg:self-start">
            <h3 className="font-display text-2xl font-bold text-navy-900">Customer Reviews</h3>
            <div className="mt-4 flex items-center gap-3">
              <span className="font-display text-5xl font-extrabold text-navy-900">{product.rating}</span>
              <div>
                <StarRating rating={product.rating} size="md" />
                <p className="mt-1 text-sm text-navy-500">{product.reviewCount} reviews</p>
              </div>
            </div>
            <div className="mt-5 space-y-2">
              {distribution.map((r) => (
                <div key={r.stars} className="flex items-center gap-2">
                  <span className="flex w-12 items-center gap-1 text-xs text-navy-500">
                    {r.stars} <Star size={10} className="fill-orange-400 text-orange-400" />
                  </span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-navy-100">
                    <div className="h-full rounded-full bg-orange-400" style={{ width: `${r.pct}%` }} />
                  </div>
                  <span className="w-8 text-right text-xs text-navy-500">{r.pct}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* review list */}
          <div className="space-y-5">
            {error ? <p role="alert" className="text-sm text-error-600">{error}</p> : null}
            {reviews.length === 0 && !error ? <p className="text-sm text-navy-500">No customer reviews yet.</p> : null}
            {reviews.map((r, i) => (
              <div key={r._id || i} className="rounded-2xl border border-navy-100 p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-50 font-display text-sm font-bold text-orange-600">
                      C
                    </div>
                    <div>
                      <p className="font-display text-sm font-bold text-navy-900">Customer</p>
                      <div className="flex items-center gap-2">
                        <StarRating rating={r.rating} />
                        {r.createdAt ? <span className="text-xs text-navy-400">{new Date(r.createdAt).toLocaleDateString()}</span> : null}
                      </div>
                    </div>
                  </div>
                </div>
                {r.comment ? <p className="mt-3 text-sm leading-relaxed text-navy-600">{r.comment}</p> : null}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
