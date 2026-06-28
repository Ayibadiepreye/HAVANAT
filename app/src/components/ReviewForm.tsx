import { useState } from 'react';
import { X, Star } from 'lucide-react';
import { useReviewStore } from '@/stores/useReviewStore';
import { useUIStore } from '@/stores/useUIStore';
import ImageUpload from './ImageUpload';

interface ReviewFormProps {
  productId: number;
  productName: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ReviewForm({ productId, productName, onClose, onSuccess }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  
  const submitReview = useReviewStore((s) => s.submitReview);
  const showToast = useUIStore((s) => s.showToast);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rating === 0) {
      showToast('Please select a rating', 'error');
      return;
    }

    if (!reviewText.trim()) {
      showToast('Please write a review', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await submitReview(productId, { rating, reviewText: reviewText.trim(), photos });
      showToast('Review submitted! It will appear after approval.', 'success');
      onSuccess();
      onClose();
    } catch (err: any) {
      showToast(err?.message || 'Failed to submit review', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePhotoUpload = (url: string) => {
    setPhotos([...photos, url]);
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="font-serif text-2xl">Write a Review</h2>
            <p className="text-sm text-gray-500 mt-1">{productName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 transition-colors"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Rating */}
          <div>
            <label className="block text-[10px] uppercase tracking-[0.1em] text-gray-500 mb-3">
              Your Rating *
            </label>
            <div className="flex items-center gap-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setRating(i + 1)}
                  onMouseEnter={() => setHoverRating(i + 1)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    size={32}
                    className={
                      i < (hoverRating || rating)
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-gray-300'
                    }
                  />
                </button>
              ))}
              {rating > 0 && (
                <span className="text-sm text-gray-600 ml-2">
                  {rating} {rating === 1 ? 'star' : 'stars'}
                </span>
              )}
            </div>
          </div>

          {/* Review Text */}
          <div>
            <label className="block text-[10px] uppercase tracking-[0.1em] text-gray-500 mb-2">
              Your Review *
            </label>
            <textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Share your experience with this product..."
              className="w-full px-4 py-3 border border-gray-200 focus:border-black focus:outline-none min-h-[150px] text-sm resize-none"
              required
            />
            <p className="text-xs text-gray-400 mt-1">
              {reviewText.length} / 1000 characters
            </p>
          </div>

          {/* Photo Uploads */}
          <div>
            <label className="block text-[10px] uppercase tracking-[0.1em] text-gray-500 mb-2">
              Add Photos (Optional)
            </label>
            <div className="grid grid-cols-3 gap-3">
              {photos.map((photo, i) => (
                <div key={i} className="relative aspect-square">
                  <img src={photo} alt={`Review ${i + 1}`} className="w-full h-full object-cover border" />
                  <button
                    type="button"
                    onClick={() => handleRemovePhoto(i)}
                    className="absolute top-1 right-1 p-1 bg-white border hover:bg-red-50 transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
              {photos.length < 3 && (
                <ImageUpload
                  onUploadComplete={handlePhotoUpload}
                  maxSizeMB={5}
                  aspectRatio="1/1"
                  label=""
                />
              )}
            </div>
            <p className="text-xs text-gray-400 mt-2">
              You can upload up to 3 photos
            </p>
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 border border-gray-300 text-[10px] uppercase tracking-[0.15em] font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || rating === 0 || !reviewText.trim()}
              className="flex-1 py-3 bg-black text-white text-[10px] uppercase tracking-[0.15em] font-medium hover:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
