import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Product } from '@/types';
import { PRODUCTS } from '@/data/mockData';
import { USE_MOCK } from '@/config';

interface ProductState {
  products: Product[];
  wishlist: number[];
  selectedProduct: Product | null;
  isLoading: boolean;
  fetchProducts: () => Promise<void>;
  selectProduct: (slug: string) => void;
  toggleWishlist: (productId: number) => void;
  isInWishlist: (productId: number) => boolean;
}

export const useProductStore = create<ProductState>()(
  persist(
    (set, get) => ({
      products: [],
      wishlist: [],
      selectedProduct: null,
      isLoading: false,

      fetchProducts: async () => {
        set({ isLoading: true });
        if (USE_MOCK) {
          await new Promise((r) => setTimeout(r, 500));
          set({ products: PRODUCTS, isLoading: false });
        } else {
          // Real API call
          set({ isLoading: false });
        }
      },

      selectProduct: (slug) => {
        const product = get().products.find((p) => p.slug === slug) || null;
        set({ selectedProduct: product });
      },

      toggleWishlist: (productId) => {
        const { wishlist } = get();
        if (wishlist.includes(productId)) {
          set({ wishlist: wishlist.filter((id) => id !== productId) });
        } else {
          set({ wishlist: [...wishlist, productId] });
        }
      },

      isInWishlist: (productId) => get().wishlist.includes(productId),
    }),
    {
      name: 'havanat-products',
      partialize: (state) => ({ wishlist: state.wishlist }),
    }
  )
);
