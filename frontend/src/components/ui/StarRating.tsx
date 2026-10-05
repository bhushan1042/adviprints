import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  size?: 'sm' | 'md';
  showNumber?: boolean;
  reviewCount?: number;
  className?: string;
}

export default function StarRating({
  rating,
  size = 'sm',
  showNumber = false,
  reviewCount,
  className = '',
}: StarRatingProps) {
  const starSize = size === 'sm' ? 14 : 18;
  const full = Math.floor(rating);
  const hasHalf = rating - full >= 0.5;

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => {
          const filled = i < full;
          const half = i === full && hasHalf;
          return (
            <Star
              key={i}
              size={starSize}
              className={
                filled || half
                  ? 'fill-orange-400 text-orange-400'
                  : 'fill-navy-100 text-navy-200'
              }
            />
          );
        })}
      </div>
      {showNumber && (
        <span className="text-sm font-medium text-navy-600">
          {rating.toFixed(1)}
          {reviewCount !== undefined && (
            <span className="text-navy-400"> ({reviewCount})</span>
          )}
        </span>
      )}
    </div>
  );
}
