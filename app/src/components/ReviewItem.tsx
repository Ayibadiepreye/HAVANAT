import { Star, Crown, Shield } from 'lucide-react';
import type { Review } from '@/stores/useReviewStore';

interface ReviewItemProps {
  review: Review;
}

const TIER_COLORS = {
  standard: 'bg-gray-100 text-gray-700',
  deluxe: 'bg-purple-100 text-purple-700',
  elite: 'bg-amber-100 text-amber-700',
};

const TIER_ICONS = {
  standard: null,
  deluxe: Crown,
  elite: Crown,
};

export default function ReviewItem({ review }: ReviewItemProps) {
  const TierIcon = TIER_ICONS[review.userTier];
  
  return (
    <div className="border-b border-gray-100 pb-6 mb-6 last:border-0">
      {/* User Info */}
      <div className="flex items-start gap-4 mb-4">
        {/* Avatar */}
        <div className="w-12 h-12 flex-shrink-0 bg-gray-100 overflow-hidden">
          {review.userAvatar ? (
            <img src={review.userAvatar} alt={review.userName} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-black text-white flex items-center justify-center font-serif text-lg">
              {review.userName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-medium text-sm">{review.userName}</span>
            {/* Membership Tier Badge */}
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[9px] uppercase tracking-[0.1em] font-semibold ${TIER_COLORS[review.userTier]}`}>
              {TierIcon && <TierIcon className="h-3 w-3" />}
              {review.userTier}
            </span>
          </div>

          {/* Star Rating */}
          <div className="flex items-center gap-1 mb-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                size={14}
                className={i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}
              />
            ))}
            <span className="text-xs text-gray-400 ml-2">
              {new Date(review.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
            </span>
          </div>
        </div>
      </div>

      {/* Review Text */}
      <p className="text-sm text-gray-700 leading-relaxed mb-4">{review.reviewText}</p>

      {/* Review Photos */}
      {review.photos && review.photos.length > 0 && (
        <div className="flex gap-2 mb-4">
          {review.photos.map((photo, i) => (
            <div key={i} className="w-20 h-20 overflow-hidden border border-gray-200">
              <img src={photo} alt={`Review ${i + 1}`} className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      )}

      {/* Admin/Moderator Reply */}
      {review.replyText && (
        <div className="mt-4 ml-12 p-4 bg-gray-50 border-l-2 border-black">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="h-4 w-4 text-gray-600" />
            <span className="text-xs font-semibold text-gray-900 uppercase tracking-[0.1em]">
              {review.replyByName || 'Havanat Team'}
            </span>
            <span className="text-[9px] px-2 py-0.5 bg-black text-white uppercase tracking-wider">
              {review.replyByRole}
            </span>
          </div>
          <p className="text-sm text-gray-700 leading-relaxed">{review.replyText}</p>
          <span className="text-xs text-gray-400 mt-2 inline-block">
            {review.replyAt && new Date(review.replyAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
          </span>
        </div>
      )}
    </div>
  );
}
