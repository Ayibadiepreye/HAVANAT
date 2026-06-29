import { useEffect } from 'react';
import { Star } from 'lucide-react';
import { useReviewStore } from '@/stores/useReviewStore';
import ReviewItem from './ReviewItem';

interface ReviewListProps {
  productId: number;
}

function RatingBar({ rating, count, total }: { rating: number; count: number; total: number }) {
  const percentage = total > 0 ? (count / total) * 100 : 0;
  
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1 w-16">
        <span className="text-xs font-medium">{rating}</span>
        <Star size={12} className="fill-amber-400 text-amber-400" />
      </div>
      <div className="flex-1 h-2 bg-gray-200 overflow-hidden">
        <div
          className="h-full bg-amber-400 transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-xs text-gray-500 w-12 text-right">{count}</span>
    </div>
  );
}

export default function ReviewList({ productId }: ReviewListProps) {
  const reviews = useReviewStore((s) => s.reviews);
  const stats = useReviewStore((s) => s.stats);
  const isLoading = useReviewStore((s) => s.isLoading);
  const fetchProductReviews = useReviewStore((s) => s.fetchProductReviews);
  const fetchReviewStats = useReviewStore((s) => s.fetchReviewStats);

  useEffect(() => {
    fetchProductReviews(productId);
    fetchReviewStats(productId);
  }, [productId, fetchProductReviews, fetchReviewStats]);

  if (isLoading && reviews.length === 0) {
    return (
      <div className="py-12 text-center text-gray-400">
        <p>Loading reviews...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Stats Summary */}
      {stats && stats.totalReviews > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-8 border-b">
          {/* Average Rating */}
          <div className="text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
              <span className="text-5xl font-bold">{Number(stats.averageRating || 0).toFixed(1)}</span>
              <div>
                <div className="flex gap-0.5 mb-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      size={16}
                      className={i < Math.round(Number(stats.averageRating || 0)) ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}
                    />
                  ))}
                </div>
                <p className="text-xs text-gray-500">
                  Based on {stats.totalReviews} {stats.totalReviews === 1 ? 'review' : 'reviews'}
                </p>
              </div>
            </div>
          </div>

          {/* Rating Distribution */}
          <div className="space-y-2">
            <RatingBar rating={5} count={stats.rating5} total={stats.totalReviews} />
            <RatingBar rating={4} count={stats.rating4} total={stats.totalReviews} />
            <RatingBar rating={3} count={stats.rating3} total={stats.totalReviews} />
            <RatingBar rating={2} count={stats.rating2} total={stats.totalReviews} />
            <RatingBar rating={1} count={stats.rating1} total={stats.totalReviews} />
          </div>
        </div>
      )}

      {/* Reviews */}
      {reviews.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-gray-400 mb-2">No reviews yet</p>
          <p className="text-sm text-gray-500">Be the first to review this product</p>
        </div>
      ) : (
        <div>
          <h3 className="text-xs tracking-[0.15em] uppercase font-semibold mb-6">
            Customer Reviews ({reviews.length})
          </h3>
          {reviews.map((review) => (
            <ReviewItem key={review.id} review={review} />
          ))}
        </div>
      )}
    </div>
  );
}
