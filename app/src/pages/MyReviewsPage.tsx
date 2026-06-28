import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Star, Edit3, Trash2, MessageSquare, Package, Crown, MapPin, Heart } from 'lucide-react';
import { useReviewStore } from '@/stores/useReviewStore';
import type { Review } from '@/stores/useReviewStore';
import { useUIStore } from '@/stores/useUIStore';
import ImageUpload from '@/components/ImageUpload';
import EmailVerificationBanner from '@/components/EmailVerificationBanner';
import MobileBottomNav, { type MobileBottomNavItem } from '@/components/MobileBottomNav';

const TIER_COLORS = {
  standard: 'bg-gray-100 text-gray-700',
  deluxe: 'bg-purple-100 text-purple-700',
  elite: 'bg-amber-100 text-amber-700',
};

export default function MyReviewsPage() {
  const navigate = useNavigate();
  const reviews = useReviewStore((s) => s.reviews);
  const isLoading = useReviewStore((s) => s.isLoading);
  const fetchMyReviews = useReviewStore((s) => s.fetchMyReviews);
  const updateMyReview = useReviewStore((s) => s.updateMyReview);
  const deleteMyReview = useReviewStore((s) => s.deleteMyReview);
  const showToast = useUIStore((s) => s.showToast);

  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [editForm, setEditForm] = useState({ rating: 5, reviewText: '', photos: [] as string[] });
  const [deletingReview, setDeletingReview] = useState<Review | null>(null);

  // Mobile bottom nav items
  const navItems: MobileBottomNavItem[] = [
    { key: 'orders', label: 'Orders', icon: Package, onClick: () => navigate('/account?tab=orders') },
    { key: 'membership', label: 'Membership', icon: Crown, onClick: () => navigate('/account?tab=membership') },
    { key: 'addresses', label: 'Addresses', icon: MapPin, onClick: () => navigate('/account?tab=addresses') },
    { key: 'wishlist', label: 'Wishlist', icon: Heart, onClick: () => navigate('/account?tab=wishlist') },
  ];

  useEffect(() => {
    fetchMyReviews();
  }, [fetchMyReviews]);

  useEffect(() => {
    if (editingReview) {
      setEditForm({
        rating: editingReview.rating,
        reviewText: editingReview.reviewText,
        photos: editingReview.photos || [],
      });
    }
  }, [editingReview]);

  const handleEdit = async () => {
    if (!editingReview) return;
    if (!editForm.reviewText.trim()) {
      showToast('Review text is required', 'error');
      return;
    }

    try {
      await updateMyReview(editingReview.id, editForm);
      setEditingReview(null);
      showToast('Review updated', 'success');
    } catch (err: any) {
      showToast(err?.message || 'Failed to update review', 'error');
    }
  };

  const handleDelete = async () => {
    if (!deletingReview) return;

    try {
      await deleteMyReview(deletingReview.id);
      setDeletingReview(null);
      showToast('Review deleted', 'success');
    } catch (err: any) {
      showToast(err?.message || 'Failed to delete review', 'error');
    }
  };

  const pendingReviews = reviews.filter((r) => !r.approved);
  const approvedReviews = reviews.filter((r) => r.approved);

  return (
    <>
      <EmailVerificationBanner />
      <main className="min-h-screen pt-20 lg:pt-24 pb-24 lg:pb-12 bg-white">
        <div className="lg:hidden h-0" />
        <div className="px-4 sm:px-6 lg:px-12 py-8 lg:py-12 max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="font-serif text-3xl mb-2">My Reviews</h1>
            <p className="text-sm text-gray-500">Manage your product reviews</p>
          </div>

          {isLoading && reviews.length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              <p>Loading your reviews...</p>
            </div>
          ) : reviews.length === 0 ? (
            <div className="py-12 text-center">
              <Star size={48} strokeWidth={1} className="mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500 mb-4">You haven't written any reviews yet</p>
              <Link to="/shop" className="text-xs tracking-[0.15em] uppercase underline">
                Browse Products
              </Link>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Pending Reviews */}
              {pendingReviews.length > 0 && (
                <div>
                  <h2 className="text-xs tracking-[0.15em] uppercase font-semibold mb-4 text-gray-500">
                    Pending Approval ({pendingReviews.length})
                  </h2>
                  <div className="space-y-4">
                    {pendingReviews.map((review) => (
                      <ReviewCard
                        key={review.id}
                        review={review}
                        onEdit={() => setEditingReview(review)}
                        onDelete={() => setDeletingReview(review)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Approved Reviews */}
              {approvedReviews.length > 0 && (
                <div>
                  <h2 className="text-xs tracking-[0.15em] uppercase font-semibold mb-4 text-gray-500">
                    Published ({approvedReviews.length})
                  </h2>
                  <div className="space-y-4">
                    {approvedReviews.map((review) => (
                      <ReviewCard key={review.id} review={review} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <MobileBottomNav activeKey="reviews" items={navItems} />

      {/* Edit Modal */}
      {editingReview && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h3 className="font-serif text-xl">Edit Review</h3>
              <p className="text-xs text-gray-500 mt-1">Changes will be re-submitted for approval</p>
            </div>
            <div className="p-6 space-y-4">
              {/* Rating */}
              <div>
                <label className="block text-[10px] uppercase tracking-[0.1em] text-gray-500 mb-2">
                  Rating *
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setEditForm({ ...editForm, rating: star })}
                      className="transition-colors"
                      aria-label={`${star} star${star !== 1 ? 's' : ''}`}
                    >
                      <Star
                        size={32}
                        className={
                          star <= editForm.rating
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-gray-300'
                        }
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Review Text */}
              <div>
                <label className="block text-[10px] uppercase tracking-[0.1em] text-gray-500 mb-2">
                  Review *
                </label>
                <textarea
                  value={editForm.reviewText}
                  onChange={(e) => setEditForm({ ...editForm, reviewText: e.target.value })}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 focus:border-black focus:outline-none resize-none"
                  rows={5}
                  placeholder="Share your experience with this product..."
                />
              </div>

              {/* Photos */}
              <div>
                <label className="block text-[10px] uppercase tracking-[0.1em] text-gray-500 mb-2">
                  Photos (Optional)
                </label>
                <ImageUpload
                  onUploadComplete={(url) => {
                    setEditForm({ ...editForm, photos: [...editForm.photos, url] });
                  }}
                  existingUrl={editForm.photos[0]}
                  onRemove={() => setEditForm({ ...editForm, photos: [] })}
                />
                {editForm.photos.length > 1 && (
                  <div className="flex gap-2 mt-2">
                    {editForm.photos.slice(1).map((photo, i) => (
                      <div key={i} className="relative w-16 h-16">
                        <img src={photo} alt={`Photo ${i + 2}`} className="w-full h-full object-cover border" />
                        <button
                          type="button"
                          onClick={() => {
                            const newPhotos = [...editForm.photos];
                            newPhotos.splice(i + 1, 1);
                            setEditForm({ ...editForm, photos: newPhotos });
                          }}
                          className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs flex items-center justify-center"
                          aria-label="Remove photo"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 border-t flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setEditingReview(null)}
                className="px-5 py-2.5 border text-[10px] uppercase tracking-[0.15em] font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleEdit}
                className="px-5 py-2.5 bg-black text-white text-[10px] uppercase tracking-[0.15em] font-medium"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deletingReview && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 max-w-md w-full">
            <h3 className="font-serif text-xl mb-2">Delete Review?</h3>
            <p className="text-sm text-gray-600 mb-5">
              This will permanently delete your review. This action cannot be undone.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setDeletingReview(null)}
                className="px-4 py-2 border text-[10px] uppercase tracking-[0.15em]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white text-[10px] uppercase tracking-[0.15em]"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function ReviewCard({
  review,
  onEdit,
  onDelete,
}: {
  review: Review;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  return (
    <div className="border border-gray-200 p-5">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className={`px-2 py-0.5 text-[9px] uppercase tracking-wider ${TIER_COLORS[review.userTier]}`}>
              {review.userTier}
            </span>
            {review.approved ? (
              <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[9px] uppercase tracking-wider">
                Published
              </span>
            ) : (
              <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-[9px] uppercase tracking-wider">
                Pending Approval
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mb-2">
            <div className="flex gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  size={14}
                  className={i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}
                />
              ))}
            </div>
            <span className="text-xs text-gray-400">
              {new Date(review.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Actions - Only show for pending reviews */}
        {!review.approved && onEdit && onDelete && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onEdit}
              className="p-2 hover:bg-gray-50 transition-colors"
              title="Edit"
            >
              <Edit3 size={14} className="text-gray-600" />
            </button>
            <button
              type="button"
              onClick={onDelete}
              className="p-2 hover:bg-red-50 transition-colors"
              title="Delete"
            >
              <Trash2 size={14} className="text-red-600" />
            </button>
          </div>
        )}
      </div>

      {/* Review Text */}
      <p className="text-sm text-gray-700 leading-relaxed mb-4">{review.reviewText}</p>

      {/* Photos */}
      {review.photos && review.photos.length > 0 && (
        <div className="flex gap-2 mb-4">
          {review.photos.map((photo, i) => (
            <div key={i} className="w-20 h-20 overflow-hidden border">
              <img src={photo} alt={`Review ${i + 1}`} className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      )}

      {/* Admin Reply */}
      {review.replyText && (
        <div className="p-4 bg-gray-50 border-l-2 border-black">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare size={12} className="text-gray-500" />
            <span className="text-xs font-semibold uppercase tracking-wider">
              {review.replyByName} • {review.replyByRole}
            </span>
          </div>
          <p className="text-sm text-gray-700">{review.replyText}</p>
        </div>
      )}
    </div>
  );
}
