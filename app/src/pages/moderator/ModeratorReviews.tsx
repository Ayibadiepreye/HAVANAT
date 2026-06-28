import { useEffect, useState } from 'react';
import { Star, MessageSquare, Check, X } from 'lucide-react';
import { useReviewStore, Review } from '@/stores/useReviewStore';
import { useUIStore } from '@/stores/useUIStore';

const TIER_COLORS = {
  standard: 'bg-gray-100 text-gray-700',
  deluxe: 'bg-purple-100 text-purple-700',
  elite: 'bg-amber-100 text-amber-700',
};

export default function ModeratorReviews() {
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('pending');
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');
  
  const reviews = useReviewStore((s) => s.reviews);
  const isLoading = useReviewStore((s) => s.isLoading);
  const fetchAllReviews = useReviewStore((s) => s.fetchAllReviews);
  const approveReview = useReviewStore((s) => s.approveReview);
  const replyToReview = useReviewStore((s) => s.replyToReview);
  const showToast = useUIStore((s) => s.showToast);

  useEffect(() => {
    const filters = filter === 'all' ? {} : { approved: filter === 'approved' };
    fetchAllReviews(filters);
  }, [filter, fetchAllReviews]);

  const handleApprove = async (reviewId: number, approved: boolean) => {
    try {
      await approveReview(reviewId, approved);
      showToast(approved ? 'Review approved' : 'Review rejected', 'success');
    } catch (err: any) {
      showToast(err?.message || 'Action failed', 'error');
    }
  };

  const handleReply = async (reviewId: number) => {
    if (!replyText.trim()) {
      showToast('Please enter a reply', 'error');
      return;
    }

    try {
      await replyToReview(reviewId, replyText.trim());
      setReplyingTo(null);
      setReplyText('');
      showToast('Reply added', 'success');
    } catch (err: any) {
      showToast(err?.message || 'Failed to add reply', 'error');
    }
  };

  const filteredReviews = reviews;
  const pendingCount = reviews.filter((r) => !r.approved).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-serif">Reviews</h1>
          <p className="text-sm text-gray-500 mt-1">Moderate customer product reviews</p>
        </div>
        
        {/* Filter Tabs */}
        <div className="flex gap-2">
          {[
            { key: 'pending' as const, label: 'Pending', count: pendingCount },
            { key: 'approved' as const, label: 'Approved' },
            { key: 'all' as const, label: 'All' },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setFilter(tab.key)}
              className={`px-4 py-2 text-xs uppercase tracking-[0.1em] font-medium transition-colors ${
                filter === tab.key
                  ? 'bg-black text-white'
                  : 'border border-gray-300 text-gray-600 hover:border-black'
              }`}
            >
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className="ml-2 px-1.5 py-0.5 bg-white text-black text-[9px] rounded">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Reviews List */}
      {isLoading && reviews.length === 0 ? (
        <div className="py-12 text-center text-gray-400">
          <p>Loading reviews...</p>
        </div>
      ) : filteredReviews.length === 0 ? (
        <div className="py-12 text-center text-gray-400">
          <p>No reviews found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReviews.map((review) => (
            <div key={review.id} className="border border-gray-200 p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {/* Avatar */}
                  <div className="w-10 h-10 flex-shrink-0 bg-gray-100 overflow-hidden">
                    {review.userAvatar ? (
                      <img src={review.userAvatar} alt={review.userName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-black text-white flex items-center justify-center font-serif text-sm">
                        {review.userName.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{review.userName}</span>
                      <span className={`px-2 py-0.5 text-[9px] uppercase tracking-wider ${TIER_COLORS[review.userTier]}`}>
                        {review.userTier}
                      </span>
                      {review.approved ? (
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[9px] uppercase tracking-wider">
                          Approved
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-[9px] uppercase tracking-wider">
                          Pending
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <div className="flex gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            size={12}
                            className={i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-gray-400">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {!review.approved && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleApprove(review.id, true)}
                        className="p-2 hover:bg-green-50 transition-colors"
                        title="Approve"
                      >
                        <Check size={16} className="text-green-600" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApprove(review.id, false)}
                        className="p-2 hover:bg-red-50 transition-colors"
                        title="Reject"
                      >
                        <X size={16} className="text-red-600" />
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => setReplyingTo(replyingTo === review.id ? null : review.id)}
                    className="p-2 hover:bg-blue-50 transition-colors"
                    title="Reply"
                  >
                    <MessageSquare size={16} className="text-blue-600" />
                  </button>
                </div>
              </div>

              {/* Review Text */}
              <p className="text-sm text-gray-700 leading-relaxed mb-4">{review.reviewText}</p>

              {/* Review Photos */}
              {review.photos && review.photos.length > 0 && (
                <div className="flex gap-2 mb-4">
                  {review.photos.map((photo, i) => (
                    <div key={i} className="w-16 h-16 overflow-hidden border">
                      <img src={photo} alt={`Review ${i + 1}`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              )}

              {/* Existing Reply */}
              {review.replyText && !replyingTo && (
                <div className="p-4 bg-gray-50 border-l-2 border-black">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-semibold uppercase tracking-wider">
                      {review.replyByName} • {review.replyByRole}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700">{review.replyText}</p>
                </div>
              )}

              {/* Reply Form */}
              {replyingTo === review.id && (
                <div className="mt-4 p-4 bg-gray-50 border-l-2 border-blue-500">
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Write your reply..."
                    className="w-full px-3 py-2 border border-gray-200 focus:border-black focus:outline-none text-sm resize-none"
                    rows={3}
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => handleReply(review.id)}
                      className="px-4 py-2 bg-black text-white text-xs uppercase tracking-wider hover:bg-gray-900"
                    >
                      Send Reply
                    </button>
                    <button
                      type="button"
                      onClick={() => { setReplyingTo(null); setReplyText(''); }}
                      className="px-4 py-2 border text-xs uppercase tracking-wider hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
