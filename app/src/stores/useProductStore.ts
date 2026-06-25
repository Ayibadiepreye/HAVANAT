import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Product } from '@/types';
import { PRODUCTS } from '@/data/mockData';
import { USE_MOCK } from '@/config';
import { apiConfig, apiGet } from '@/lib/api';

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
        try {
          if (apiConfig.useBackend) {
            const res = await apiGet<{ items: any[]; total: number }>('/api/products');
            // Map backend Product → frontend Product shape
            const mapped: Product[] = res.items.map((p) => ({
              id: p.id as any,
              slug: p.slug,
              name: p.name,
              description: p.description || '',
              details: p.details || {},
              price: Number(p.price),
              originalPrice: p.originalPrice ? Number(p.originalPrice) : undefined,
              images: p.images || [],
              category: p.category,
              sizes: p.sizes || [],
              colors: p.colors || [],
              fit: p.fit || 'Tailored',
              occasion: p.occasion || undefined,
              stock: p.stock ?? 0,
              lowStockThreshold: p.lowStockThreshold ?? 5,
              deliveryFee: p.deliveryFee ? Number(p.deliveryFee) : 2500,
              deluxeDiscount: p.deluxeDiscount ? Number(p.deluxeDiscount) : undefined,
              eliteDiscount: p.eliteDiscount ? Number(p.eliteDiscount) : undefined,
              inStock: p.inStock,
              published: p.published,
              createdAt: p.createdAt,
              updatedAt: p.updatedAt,
            }));
            set({ products: mapped, isLoading: false });
            return;
          }
          if (USE_MOCK) {
            await new Promise((r) => setTimeout(r, 500));
            set({ products: PRODUCTS, isLoading: false });
          } else {
            set({ isLoading: false });
          }
        } catch (err) {
          console.error('fetchProducts failed', err);
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
