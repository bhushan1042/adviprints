import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowRight, Home as HomeIcon } from 'lucide-react';
import ProductCard from '@/components/ui/ProductCard';
import useCatalogCategories from '@/hooks/useCatalogCategories';
import { listCategoryProducts } from '@/services/catalog';
import { getErrorMessage, isRequestAborted } from '@/services/api';
import { applyImageFallback } from '@/utils/images';
import categoryPlaceholder from '@/assets/placeholders/category-placeholder.png';
import Seo from '@/seo/Seo';
import { CATEGORIES_META, categoryMeta } from '@/seo/seoCore.mjs';

type SortOption = 'featured' | 'price-low' | 'price-high' | 'rating' | 'newest';

export default function Category() {
  const { slug } = useParams<{ slug: string }>();
  const { categories, error: categoriesError, loading: categoriesLoading } = useCatalogCategories();
  const [products, setProducts] = useState<Awaited<ReturnType<typeof listCategoryProducts>>>([]);
  const [loading, setLoading] = useState(slug !== 'all');
  const [loadError, setLoadError] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('featured');
  const isDirectory = slug === 'all';
  const categoryInfo = categories.find((category) => category.slug === slug);

  useEffect(() => {
    if (isDirectory || categoriesLoading) {
      setLoading(false);
      setLoadError('');
      return;
    }

    const controller = new AbortController();
    let ignore = false;
    setLoading(true);
    setLoadError('');
    const request = listCategoryProducts(slug || '', categories, controller.signal);
    request
      .then((items) => {
        if (!ignore) setProducts(items);
      })
      .catch((error) => {
        if (!ignore && !isRequestAborted(error)) {
          setLoadError(getErrorMessage(error, 'Unable to load products.'));
        }
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
      controller.abort();
    };
  }, [slug, isDirectory, categories, categoriesLoading]);

  const sortedProducts = useMemo(() => {
    const items = [...products];
    switch (sortBy) {
      case 'price-low': return items.sort((a, b) => a.price - b.price);
      case 'price-high': return items.sort((a, b) => b.price - a.price);
      case 'rating': return items.sort((a, b) => b.rating - a.rating);
      case 'newest': return items.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      default: return items.sort((a, b) => (b.bestseller ? 1 : 0) - (a.bestseller ? 1 : 0));
    }
  }, [products, sortBy]);

  const title = isDirectory ? 'All Categories' : categoryInfo?.name || 'Collection';
  const meta = isDirectory ? CATEGORIES_META : categoryInfo ? categoryMeta(categoryInfo) : null;

  return (
    <div className="bg-white">
      {meta && <Seo {...meta} noindex={!isDirectory && (Boolean(loadError) || (!categoriesLoading && !loading && products.length === 0))} />}
      <div className="border-b border-navy-100 bg-navy-50">
        <nav aria-label="Breadcrumb" className="container-px mx-auto flex max-w-[1600px] items-center gap-2 py-4 text-sm text-navy-500">
          <Link to="/" className="flex items-center gap-1 transition-colors hover:text-orange-600"><HomeIcon size={14} /> Home</Link>
          <span aria-hidden="true">/</span>
          {!isDirectory && <><Link to="/category/all" className="hover:text-orange-600">All Categories</Link><span aria-hidden="true">/</span></>}
          <span className="font-medium text-navy-800" aria-current="page">{title}</span>
        </nav>
      </div>

      <div className="container-px mx-auto max-w-[1600px] py-10 lg:py-14">
        <p className="text-sm font-bold uppercase tracking-widest text-orange-500">Explore Adviprints</p>
        <h1 className="mt-2 font-display text-3xl font-bold text-navy-900 sm:text-4xl">{title}</h1>
        <p className="mt-3 max-w-2xl text-navy-500">
          {isDirectory ? 'Explore our categories and find something you love.' : `Explore the ${categoryInfo?.name || 'selected'} collection.`}
        </p>
      </div>

      <nav aria-label="Shop categories" className="bg-navy-800 text-white">
        <div className="container-px mx-auto flex max-w-[1600px] gap-6 overflow-x-auto whitespace-nowrap">
          {[
            { name: 'All Categories', path: '/category/all', active: isDirectory },
            ...categories.map((category) => ({ name: category.name, path: `/category/${category.slug}`, active: !isDirectory && slug === category.slug }))
          ].map((item) => (
            <Link key={item.path} to={item.path} aria-current={item.active ? 'page' : undefined}
              className={`border-b-2 py-4 text-sm font-semibold transition-colors ${item.active ? 'border-orange-400 text-white' : 'border-transparent text-navy-200 hover:text-white'}`}>
              {item.name}
            </Link>
          ))}
        </div>
      </nav>

      <div className={`container-px mx-auto max-w-[1600px] py-10 lg:py-12 ${isDirectory ? '' : 'rounded-t-[2rem] bg-[#fffaf6]'}`}>
        {categoriesError && <p role="alert" className="mb-6 text-sm text-error-600">{categoriesError}</p>}
        {isDirectory ? (
          categoriesLoading ? <p className="text-navy-500">Loading categories…</p> :
          categories.length ? (
            <>
              <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
                <div><h2 className="font-display text-2xl font-bold text-navy-900">Find your favourites</h2><p className="mt-2 text-sm text-navy-500">Choose a category to explore its products.</p></div>
              </div>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                {categories.map((category) => (
                  <Link key={category.id} to={`/category/${category.slug}`} className="group overflow-hidden rounded-2xl border border-navy-100 bg-white transition-shadow hover:shadow-lg">
                    <div className="aspect-square overflow-hidden bg-navy-50">
                      <img src={category.image} alt="" loading="lazy" onError={(event) => applyImageFallback(event, categoryPlaceholder)}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100" />
                    </div>
                    <div className="flex items-center justify-between gap-2 p-4">
                      <h3 className="font-display text-sm font-bold text-navy-900 sm:text-base">{category.name}</h3>
                      <ArrowRight size={18} className="shrink-0 text-orange-500" aria-hidden="true" />
                    </div>
                  </Link>
                ))}
              </div>
            </>
          ) : !categoriesError && <p className="text-navy-500">No categories are available right now.</p>
        ) : categoriesLoading || loading ? (
          <p className="text-navy-500">Loading products…</p>
        ) : loadError ? (
          <p role="alert" className="text-error-600">{loadError}</p>
        ) : (
          <>
            <div className="mb-7 flex flex-wrap items-end justify-between gap-4 border-b border-orange-100 pb-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-600">The collection</p>
                <h2 className="mt-1 font-display text-2xl font-bold text-navy-900 sm:text-3xl">Find your favourite</h2>
                <p className="mt-2 text-sm text-navy-500"><span className="font-semibold text-navy-800">{sortedProducts.length}</span> {sortedProducts.length === 1 ? 'product' : 'products'} to explore</p>
              </div>
              <label className="flex items-center gap-2 text-sm font-semibold text-navy-700">
                Sort by
                <select value={sortBy} onChange={(event) => setSortBy(event.target.value as SortOption)} className="rounded-xl border border-navy-200 bg-white px-3 py-2.5 text-navy-800 shadow-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100">
                  <option value="featured">Featured</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="rating">Top Rated</option>
                  <option value="newest">Newest</option>
                </select>
              </label>
            </div>
            {sortedProducts.length ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4 lg:gap-6">
                {sortedProducts.map((product, index) => <ProductCard key={product.id} product={product} index={index} />)}
              </div>
            ) : <p className="py-12 text-center text-navy-500">No products are available in this collection right now.</p>}
          </>
        )}
      </div>
    </div>
  );
}
