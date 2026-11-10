import { Link } from 'react-router-dom';
import { ArrowRight, Star } from 'lucide-react';
import type { Product } from '@/data/products';
import categoryPlaceholder from '@/assets/placeholders/category-placeholder.png';
import { applyImageFallback } from '@/utils/images';

interface ProductCardProps {
  product: Product;
  index?: number;
}

export default function ProductCard({ product, index = 0 }: ProductCardProps) {
  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <article
      className="group relative flex h-full flex-col overflow-hidden rounded-[1.5rem] border border-navy-100/80 bg-white shadow-[0_8px_30px_rgba(16,42,67,0.06)] transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-1 hover:border-orange-200 hover:shadow-[0_18px_40px_rgba(16,42,67,0.12)] motion-reduce:transform-none motion-reduce:transition-none"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <Link
        to={`/product/${product.slug}`}
        className="relative m-2 block overflow-hidden rounded-[1.15rem] bg-navy-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500"
      >
        <div className="aspect-[4/5] overflow-hidden">
          <img
            src={product.thumbnail || product.images[0]}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 motion-reduce:transform-none motion-reduce:transition-none"
            onError={(event) => applyImageFallback(event, product.thumbnail && product.thumbnail !== product.images[0] ? product.images[0] : categoryPlaceholder)}
          />
        </div>

        {(!product.thumbnail || product.thumbnail === product.images[0]) && product.images[1] && (
          <img
            src={product.images[1]}
            alt=""
            loading="lazy"
            aria-hidden
            className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100 motion-reduce:transition-none"
            onError={(event) => applyImageFallback(event, categoryPlaceholder)}
          />
        )}

        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          {product.bestseller && (
            <span className="rounded-full bg-orange-500 px-3 py-1 text-xs font-bold text-white shadow-md">
              Bestseller
            </span>
          )}
          {product.isNew && (
            <span className="rounded-full bg-navy-800 px-3 py-1 text-xs font-bold text-white shadow-md">
              New
            </span>
          )}
          {discount > 0 && (
            <span className="rounded-full bg-error-500 px-3 py-1 text-xs font-bold text-white shadow-md">
              {discount}% Off
            </span>
          )}
        </div>

        <span aria-hidden="true" className="absolute bottom-3 right-3 flex h-10 w-10 items-center justify-center rounded-full bg-white text-navy-900 shadow-lg transition-colors duration-300 group-hover:bg-orange-500 group-hover:text-white motion-reduce:transition-none">
          <ArrowRight size={18} />
        </span>
      </Link>

      <div className="flex flex-1 flex-col px-4 pb-4 pt-2 sm:px-5 sm:pb-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <span className="rounded-full bg-orange-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-orange-700">
            {product.categoryName || 'Products'}
          </span>
          {product.reviewCount > 0 && (
            <span className="flex items-center gap-1 text-xs font-semibold text-navy-600" aria-label={`${product.rating.toFixed(1)} out of 5, ${product.reviewCount} reviews`}>
              <Star size={14} className="fill-orange-400 text-orange-400" aria-hidden="true" />
              {product.rating.toFixed(1)} <span className="font-normal text-navy-400">({product.reviewCount})</span>
            </span>
          )}
        </div>

        <Link to={`/product/${product.slug}`}>
          <h3 className="font-display text-sm font-bold leading-snug text-navy-900 transition-colors hover:text-orange-600 sm:text-base">
            {product.name}
          </h3>
        </Link>

        {product.colors.length > 0 && <div className="mt-3 flex items-center gap-1.5" aria-label={`Colours: ${product.colors.map((c) => c.name).join(', ')}`}>
          
          {product.colors.length > 5 && (
            <span className="text-xs text-navy-400">+{product.colors.length - 5}</span>
          )}
        </div>}

        <div className="mt-auto flex flex-wrap items-end justify-between gap-2 pt-5">
          <div className="flex flex-wrap items-baseline gap-x-2">
            <span className="font-display text-base font-bold text-navy-900 sm:text-lg">
              Rs {product.price}
            </span>
            {product.originalPrice && (
              <span className="text-sm text-navy-400 line-through">
                Rs {product.originalPrice}
              </span>
            )}
          </div>
          <Link
            to={`/product/${product.slug}`}
            className="inline-flex items-center gap-1 text-xs font-bold text-orange-700 transition-colors hover:text-orange-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 sm:text-sm"
            aria-label={`View ${product.name}`}
          >
            View <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </article>
  );
}
