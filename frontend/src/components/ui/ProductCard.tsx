import { Link } from 'react-router-dom';
import { Eye, ArrowRight } from 'lucide-react';
import type { Product } from '@/data/products';
import categoryPlaceholder from '@/assets/placeholders/category-placeholder.png';
import { applyImageFallback } from '@/utils/images';
import StarRating from './StarRating';

interface ProductCardProps {
  product: Product;
  index?: number;
}

export default function ProductCard({ product, index = 0 }: ProductCardProps) {
  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <div
      className="group relative flex flex-col"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <Link
        to={`/product/${product.slug}`}
        className="relative block overflow-hidden rounded-2xl bg-navy-50"
      >
        <div className="aspect-[4/5] overflow-hidden">
          <img
            src={product.images[0]}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            onError={(event) => applyImageFallback(event, categoryPlaceholder)}
          />
        </div>

        {product.images[1] && (
          <img
            src={product.images[1]}
            alt=""
            loading="lazy"
            aria-hidden
            className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
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

        <div className="absolute inset-x-0 bottom-0 flex translate-y-full items-center justify-center gap-2 bg-gradient-to-t from-navy-900/80 to-transparent p-4 transition-transform duration-300 group-hover:translate-y-0">
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/95 px-4 py-2 text-sm font-semibold text-navy-800 backdrop-blur">
            <Eye size={16} /> View Details
          </span>
        </div>
      </Link>

      <div className="mt-4 flex flex-1 flex-col">
        <div className="mb-1 flex items-center justify-between gap-2">
          <span className="text-xs font-medium uppercase tracking-wide text-orange-500">
            {product.categoryName || 'Custom apparel'}
          </span>
          <StarRating rating={product.rating} />
        </div>

        <Link to={`/product/${product.slug}`}>
          <h3 className="font-display text-base font-semibold leading-snug text-navy-800 transition-colors hover:text-orange-600">
            {product.name}
          </h3>
        </Link>

        <div className="mt-2 flex items-center gap-1.5">
          {product.colors.slice(0, 5).map((c) => (
            <span
              key={c.name}
              title={c.name}
              className="h-3.5 w-3.5 rounded-full border border-navy-200"
              style={{ backgroundColor: c.hex }}
            />
          ))}
          {product.colors.length > 5 && (
            <span className="text-xs text-navy-400">+{product.colors.length - 5}</span>
          )}
        </div>

        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="font-display text-lg font-bold text-navy-900">
              Rs {product.price}
            </span>
            {product.originalPrice && (
              <span className="text-sm text-navy-400 line-through">
                Rs {product.originalPrice}
              </span>
            )}
          </div>
          <Link
            to={`/product/${product.id}`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-navy-50 px-3 py-2 text-sm font-semibold text-navy-700 transition-all hover:bg-orange-500 hover:text-white active:scale-95"
            aria-label={`View ${product.name}`}
          >
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
}
