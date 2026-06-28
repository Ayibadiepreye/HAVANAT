import { create } from 'zustand';
import { apiGet, apiPost, apiPatch, apiDelete } from '@/lib/api';

export interface Review {
  id: number;
  productId: number;
  userId: number;
  orderId: number | null;
  rating: number;
  reviewText: string;
  userTier: 'standard' | 'deluxe' | 'elite';
  userName: string;
  userAvatar: string | null;
  photos: string[];
  approved: boolean;
  approvedBy: number | null;
  approvedAt: string | null;
  replyText: string | null;
  replyBy: number | null;
  replyByName: string | null;
  replyByRole: string | null;
  replyAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewStats {
  totalReviews: number;
  averageRating: number;
  rating5: number;
  rating4: number;
  rating3: number;
  rating2: number;
  rating1: number;
}

interface ReviewStore {
  reviews: Review[];
  stats: ReviewStats | null;
  isLoading: boolean;

  // Public: Get approved reviews for a product
  fetchProductReviews: (productId: number) => Promise<void>;
  
  // Public: Get review stats for a product
  fetchReviewStats: (productId: number) => Promise<void>;

  // Customer: Submit a review
  submitReview: (productId: number, data: { rating: number; reviewText: string; photos?: string[] }) => Promise<void>;

  // Customer: Get my own reviews
  fetchMyReviews: () => Promise<void>;

  // Customer: Update my own pending review
  updateMyReview: (reviewId: number, data: { rating?: number; reviewText?: string; photos?: string[] }) => Promise<void>;

  // Customer: Delete my own pending review
  deleteMyReview: (reviewId: number) => Promise<void>;

  // Admin/Mod: Get all reviews
  fetchAllReviews: (filters?: { approved?: boolean; productId?: number }) => Promise<void>;

  // Admin/Mod: Approve/reject a review
  approveReview: (reviewId: number, approved: boolean) => Promise<void>;

  // Admin/Mod: Reply to a review
  replyToReview: (reviewId: number, replyText: string) => Promise<void>;

  // Admin: Delete a review
  deleteReview: (reviewId: number) => Promise<void>;

  // Clear state
  clearReviews: () => void;
}

export const useReviewStore = create<ReviewStore>((set) => ({
  reviews: [],
  stats: null,
  isLoading: false,

  fetchProductReviews: async (productId) => {
    set({ isLoading: true });
    try {
      const data = await apiGet<{ reviews: Review[] }>(`/api/products/${productId}/reviews`);
      set({ reviews: data.reviews, isLoading: false });
    } catch (err) {
      console.error('fetchProductReviews failed', err);
      set({ isLoading: false });
    }
  },

  fetchReviewStats: async (productId) => {
    try {
      const stats = await apiGet<ReviewStats>(`/api/reviews/stats/${productId}`);
      set({ stats });
    } catch (err) {
      console.error('fetchReviewStats failed', err);
    }
  },

  submitReview: async (productId, data) => {
    set({ isLoading: true });
    try {
      await apiPost(`/api/products/${productId}/reviews`, data, true);
      set({ isLoading: false });
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  fetchMyReviews: async () => {
    set({ isLoading: true });
    try {
      const data = await apiGet<{ reviews: Review[] }>('/api/reviews/my-reviews', true);
      set({ reviews: data.reviews, isLoading: false });
    } catch (err) {
      console.error('fetchMyReviews failed', err);
      set({ isLoading: false });
    }
  },

  updateMyReview: async (reviewId, data) => {
    set({ isLoading: true });
    try {
      const result = await apiPatch<{ review: Review }>(`/api/reviews/${reviewId}`, data, true);
      set((state) => ({
        reviews: state.reviews.map((r) => (r.id === reviewId ? result.review : r)),
        isLoading: false,
      }));
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  deleteMyReview: async (reviewId) => {
    try {
      await apiDelete(`/api/reviews/my-reviews/${reviewId}`, true);
      set((state) => ({
        reviews: state.reviews.filter((r) => r.id !== reviewId),
      }));
    } catch (err) {
      throw err;
    }
  },

  fetchAllReviews: async (filters) => {
    set({ isLoading: true });
    try {
      const params = new URLSearchParams();
      if (filters?.approved !== undefined) params.set('approved', String(filters.approved));
      if (filters?.productId) params.set('productId', String(filters.productId));
      
      const query = params.toString();
      const data = await apiGet<{ reviews: Review[] }>(`/api/reviews${query ? `?${query}` : ''}`, true);
      set({ reviews: data.reviews, isLoading: false });
    } catch (err) {
      console.error('fetchAllReviews failed', err);
      set({ isLoading: false });
    }
  },

  approveReview: async (reviewId, approved) => {
    try {
      const data = await apiPatch<{ review: Review }>(`/api/reviews/${reviewId}/approve`, { approved }, true);
      set((state) => ({
        reviews: state.reviews.map((r) => (r.id === reviewId ? data.review : r)),
      }));
    } catch (err) {
      throw err;
    }
  },

  replyToReview: async (reviewId, replyText) => {
    try {
      const data = await apiPatch<{ review: Review }>(`/api/reviews/${reviewId}/reply`, { replyText }, true);
      set((state) => ({
        reviews: state.reviews.map((r) => (r.id === reviewId ? data.review : r)),
      }));
    } catch (err) {
      throw err;
    }
  },

  deleteReview: async (reviewId) => {
    try {
      await apiDelete(`/api/reviews/${reviewId}`, true);
      set((state) => ({
        reviews: state.reviews.filter((r) => r.id !== reviewId),
      }));
    } catch (err) {
      throw err;
    }
  },

  clearReviews: () => set({ reviews: [], stats: null }),
}));
