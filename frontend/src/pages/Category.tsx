import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { SlidersHorizontal, ChevronDown, Check, X, Home as HomeIcon } from 'lucide-react';
import ProductCard from '@/components/ui/ProductCard';
import SectionHeading from '@/components/ui/SectionHeading';
import useCatalogCategories from '@/hooks/useCatalogCategories';
import { listCategoryProducts, listProducts } from '@/services/catalog';
import { getErrorMessage, isRequestAborted } from '@/services/api';
import Seo from '@/seo/Seo';
import { SHOP_META, categoryMeta } from '@/seo/seoCore.mjs';

type SortOption = 'featured' | 'price-low' | 'price-high' | 'rating' | 'newest';

export default function Category() {
  const { slug } = useParams<{ slug: string }>();
  const { categories, error: categoriesError } = useCatalogCategories();
  const [products, setProducts] = useState<Awaited<ReturnType<typeof listProducts>>>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('featured');
  const [sortOpen, setSortOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, Number.MAX_SAFE_INTEGER]);

  const categoryInfo = categories.find((c) => c.slug === slug);
  const isAll = !slug || slug === 'all';

  useEffect(() => {
    const controller = new AbortController();
    let ignore = false;

    setLoading(true);
    setLoadError('');
    const request = isAll
      ? listProducts(categories, controller.signal)
      : listCategoryProducts(slug || '', categories, controller.signal);

    request
      .then((items) => {
        if (!ignore) setProducts(items);
      })
      .catch((requestError) => {
        if (!ignore && !isRequestAborted(requestError)) {
          setLoadError(getErrorMessage(requestError, 'Unable to load products.'));
        }
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
      controller.abort();
    };
  }, [slug, isAll, categories]);

  const maxPrice = useMemo(
    () => Math.max(0, ...products.map((product) => product.price)),
    [products]
  );

  const allColors = useMemo(() => {
    const set = new Map<string, string>();
    products.forEach((p) => p.colors.forEach((c) => set.set(c.name, c.hex)));
    return Array.from(set.entries()).map(([name, hex]) => ({ name, hex }));
  }, [products]);

  const allSizes = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => p.sizes.forEach((s) => set.add(s)));
    return Array.from(set).sort();
  }, [products]);

  const filtered = useMemo(() => {
    let list = isAll ? products : products.filter((p) => p.category === slug);

    if (selectedColors.length > 0) {
      list = list.filter((p) => p.colors.some((c) => selectedColors.includes(c.name)));
    }
    if (selectedSizes.length > 0) {
      list = list.filter((p) => p.sizes.some((s) => selectedSizes.includes(s)));
    }
    list = list.filter((p) => p.price >= priceRange[0] && p.price <= priceRange[1]);

    switch (sortBy) {
      case 'price-low':
        return [...list].sort((a, b) => a.price - b.price);
      case 'price-high':
        return [...list].sort((a, b) => b.price - a.price);
      case 'rating':
        return [...list].sort((a, b) => b.rating - a.rating);
      case 'newest':
        return [...list].sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      default:
        return [...list].sort((a, b) => (b.bestseller ? 1 : 0) - (a.bestseller ? 1 : 0));
    }
  }, [products, slug, isAll, selectedColors, selectedSizes, priceRange, sortBy]);

  const toggleColor = (name: string) =>
    setSelectedColors((prev) => (prev.includes(name) ? prev.filter((c) => c !== name) : [...prev, name]));
  const toggleSize = (size: string) =>
    setSelectedSizes((prev) => (prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]));

  const clearFilters = () => {
    setSelectedColors([]);
    setSelectedSizes([]);
    setPriceRange([0, Number.MAX_SAFE_INTEGER]);
  };

  const activeFilterCount = selectedColors.length + selectedSizes.length + (priceRange[1] < maxPrice ? 1 : 0);

  const sortLabels: Record<SortOption, string> = {
    featured: 'Featured',
    'price-low': 'Price: Low to High',
    'price-high': 'Price: High to Low',
    rating: 'Top Rated',
    newest: 'Newest',
  };

  if (loading) {
    return <div className="container-px mx-auto max-w-7xl py-20 text-center text-navy-500">Loading products…</div>;
  }

  if (loadError) {
    return (
      <>
        <Seo title="Products unavailable" description="This page could not be loaded." noindex />
        <div role="alert" className="container-px mx-auto max-w-7xl py-20 text-center text-error-600">{loadError}</div>
      </>
    );
  }

  const seoMeta = isAll || !categoryInfo ? SHOP_META : categoryMeta(categoryInfo);
  const seoNoIndex = !isAll && products.length === 0;

  return (
    <div className="bg-white">
      {(isAll || categoryInfo) && <Seo {...seoMeta} noindex={seoNoIndex} />}
      {/* breadcrumb */}
      <div className="border-b border-navy-100 bg-navy-50">
        <div className="container-px mx-auto max-w-7xl py-4">
          <nav className="flex items-center gap-2 text-sm text-navy-500">
            <Link to="/" className="flex items-center gap-1 transition-colors hover:text-orange-600">
              <HomeIcon size={14} /> Home
            </Link>
            <span>/</span>
            <Link to="/category/all" className="transition-colors hover:text-orange-600">Shop</Link>
            {!isAll && (
              <>
                <span>/</span>
                <span className="font-medium text-navy-800">{categoryInfo?.name}</span>
              </>
            )}
            {isAll && <span className="font-medium text-navy-800">All T-Shirts</span>}
          </nav>
          {categoriesError ? <p role="alert" className="mt-2 text-xs text-error-600">{categoriesError}</p> : null}
        </div>
      </div>

      {/* header */}
      <div className="border-b border-navy-100">
        <div className="container-px mx-auto max-w-7xl py-10">
          <SectionHeading
            eyebrow={isAll ? 'Full Collection' : categoryInfo?.name || 'Collection'}
            title={isAll ? 'All Custom T-Shirts' : categoryInfo?.name || slug || 'Collection'}
            subtitle={isAll
              ? 'Browse our complete range of t-shirts. Find your style and place your order.'
              : `Choose from our ${(categoryInfo?.name || slug || 'selected').toLowerCase()} collection.`}
          />
        </div>
      </div>

      {/* content */}
      <div className="container-px mx-auto max-w-7xl py-10">
        <div className="flex gap-8">
          {/* sidebar filters */}
          <aside className="hidden w-64 shrink-0 lg:block">
            <FilterPanel
              allColors={allColors}
              allSizes={allSizes}
              selectedColors={selectedColors}
              selectedSizes={selectedSizes}
              priceRange={priceRange}
              maxPrice={maxPrice}
              onToggleColor={toggleColor}
              onToggleSize={toggleSize}
              onPriceChange={setPriceRange}
              onClear={clearFilters}
              activeCount={activeFilterCount}
            />
          </aside>

          {/* main */}
          <div className="flex-1">
            {/* toolbar */}
            <div className="mb-6 flex items-center justify-between gap-4">
              <p className="text-sm text-navy-500">
                <span className="font-semibold text-navy-800">{filtered.length}</span> products
              </p>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setFilterOpen(true)}
                  className="inline-flex items-center gap-2 rounded-xl border border-navy-200 px-4 py-2.5 text-sm font-semibold text-navy-700 transition-colors hover:border-orange-400 hover:text-orange-600 lg:hidden"
                >
                  <SlidersHorizontal size={16} />
                  Filters
                  {activeFilterCount > 0 && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-xs text-white">{activeFilterCount}</span>
                  )}
                </button>

                {/* sort */}
                <div className="relative">
                  <button
                    onClick={() => setSortOpen((v) => !v)}
                    className="inline-flex items-center gap-2 rounded-xl border border-navy-200 px-4 py-2.5 text-sm font-semibold text-navy-700 transition-colors hover:border-orange-400"
                  >
                    Sort: <span className="text-orange-600">{sortLabels[sortBy]}</span>
                    <ChevronDown size={15} className={`transition-transform ${sortOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {sortOpen && (
                    <div className="absolute right-0 top-full z-10 mt-2 w-56 overflow-hidden rounded-xl border border-navy-100 bg-white py-1.5 shadow-xl">
                      {(Object.keys(sortLabels) as SortOption[]).map((opt) => (
                        <button
                          key={opt}
                          onClick={() => { setSortBy(opt); setSortOpen(false); }}
                          className={`flex w-full items-center justify-between px-4 py-2.5 text-sm transition-colors hover:bg-orange-50 ${
                            sortBy === opt ? 'font-semibold text-orange-600' : 'text-navy-700'
                          }`}
                        >
                          {sortLabels[opt]}
                          {sortBy === opt && <Check size={15} />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* active filter chips */}
            {activeFilterCount > 0 && (
              <div className="mb-5 flex flex-wrap items-center gap-2">
                {selectedColors.map((c) => (
                  <button
                    key={c}
                    onClick={() => toggleColor(c)}
                    className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-3 py-1.5 text-xs font-medium text-orange-700 transition-colors hover:bg-orange-100"
                  >
                    {c} <X size={13} />
                  </button>
                ))}
                {selectedSizes.map((s) => (
                  <button
                    key={s}
                    onClick={() => toggleSize(s)}
                    className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-3 py-1.5 text-xs font-medium text-orange-700 transition-colors hover:bg-orange-100"
                  >
                    Size {s} <X size={13} />
                  </button>
                ))}
                <button
                  onClick={clearFilters}
                  className="text-xs font-semibold text-navy-500 underline transition-colors hover:text-orange-600"
                >
                  Clear All
                </button>
              </div>
            )}

            {/* grid */}
            {filtered.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {filtered.map((p, i) => (
                  <ProductCard key={p.id} product={p} index={i} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-navy-100">
                  <SlidersHorizontal size={28} className="text-navy-400" />
                </div>
                <h3 className="font-display text-lg font-bold text-navy-800">No products found</h3>
                <p className="mt-1 text-sm text-navy-500">Try adjusting your filters to see more results.</p>
                <button
                  onClick={clearFilters}
                  className="mt-4 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-orange-600"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* mobile filter drawer */}
      {filterOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-navy-900/50 backdrop-blur-sm" onClick={() => setFilterOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-80 max-w-[85vw] overflow-y-auto bg-white p-6">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-navy-900">Filters</h3>
              <button onClick={() => setFilterOpen(false)} className="text-navy-500 hover:text-orange-600">
                <X size={22} />
              </button>
            </div>
            <FilterPanel
              allColors={allColors}
              allSizes={allSizes}
              selectedColors={selectedColors}
              selectedSizes={selectedSizes}
              priceRange={priceRange}
              maxPrice={maxPrice}
              onToggleColor={toggleColor}
              onToggleSize={toggleSize}
              onPriceChange={setPriceRange}
              onClear={clearFilters}
              activeCount={activeFilterCount}
            />
          </div>
        </div>
      )}
    </div>
  );
}

interface FilterPanelProps {
  allColors: { name: string; hex: string }[];
  allSizes: string[];
  selectedColors: string[];
  selectedSizes: string[];
  priceRange: [number, number];
  maxPrice: number;
  onToggleColor: (name: string) => void;
  onToggleSize: (size: string) => void;
  onPriceChange: (range: [number, number]) => void;
  onClear: () => void;
  activeCount: number;
}

function FilterPanel(props: FilterPanelProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-sm font-bold uppercase tracking-wide text-navy-900">
          Filters
        </h3>
        {props.activeCount > 0 && (
          <button
            onClick={props.onClear}
            className="text-xs font-semibold text-orange-600 hover:text-orange-700"
          >
            Clear ({props.activeCount})
          </button>
        )}
      </div>

      {/* price */}
      <div>
        <h4 className="mb-3 font-display text-sm font-semibold text-navy-800">Price Range</h4>
        <div className="flex items-center gap-2">
          <input
            type="range"
            min={0}
            max={props.maxPrice || 1}
            step={50}
            value={Math.min(props.priceRange[1], props.maxPrice || 1)}
            onChange={(e) => props.onPriceChange([0, Number(e.target.value)])}
            className="w-full accent-orange-500"
          />
        </div>
        <div className="mt-2 flex justify-between text-xs text-navy-500">
          <span>Rs 0</span>
          <span className="font-semibold text-navy-800">
            Up to Rs {Math.min(props.priceRange[1], props.maxPrice || 1)}
          </span>
        </div>
      </div>

      <div className="h-px bg-navy-100" />

      {/* colors */}
      <div>
        <h4 className="mb-3 font-display text-sm font-semibold text-navy-800">Colour</h4>
        <div className="flex flex-wrap gap-2">
          {props.allColors.map((c) => {
            const selected = props.selectedColors.includes(c.name);
            return (
              <button
                key={c.name}
                onClick={() => props.onToggleColor(c.name)}
                title={c.name}
                className={`relative h-8 w-8 rounded-full border-2 transition-all ${
                  selected ? 'border-orange-500 ring-2 ring-orange-200' : 'border-navy-200'
                }`}
                style={{ backgroundColor: c.hex }}
              >
                {selected && (
                  <Check
                    size={14}
                    className="absolute inset-0 m-auto text-white drop-shadow"
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="h-px bg-navy-100" />

      {/* sizes */}
      <div>
        <h4 className="mb-3 font-display text-sm font-semibold text-navy-800">Size</h4>
        <div className="flex flex-wrap gap-2">
          {props.allSizes.map((s) => {
            const selected = props.selectedSizes.includes(s);
            return (
              <button
                key={s}
                onClick={() => props.onToggleSize(s)}
                className={`min-w-[2.5rem] rounded-lg border px-3 py-2 text-sm font-semibold transition-all ${
                  selected
                    ? 'border-orange-500 bg-orange-500 text-white'
                    : 'border-navy-200 text-navy-700 hover:border-orange-400'
                }`}
              >
                {s}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
