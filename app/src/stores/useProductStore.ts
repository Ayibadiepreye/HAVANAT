import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Product } from '@/types';
import { apiConfig, apiGet } from '@/lib/api';

interface ProductState {
  products: Product[];
  wishlist: number[];
  selectedProduct: Product | null;
  isLoading: boolean;
  fetchProducts: (opts?: { sneakPeek?: boolean }) => Promise<void>;
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

      fetchProducts: async (opts) => {
        set({ isLoading: true });
        try {
          if (apiConfig.useBackend) {
            // The store trusts the caller's intent. If the caller passed
            // sneakPeek: true, they have already verified the user is
            // eligible (e.g. via useMembershipStatus which fetches
            // /api/memberships/me). The backend is the authoritative
            // gate — it returns 403 if the JWT is truly ineligible.
            //
            // We deliberately do NOT add a second JWT-based check here,
            // because the JWT can be stale (signed before a tier upgrade)
            // and the DB-backed useMembershipStatus is the source of truth.
            // If we double-checked against the JWT, we'd silently strip
            // ?sneakPeek=true for an upgraded user with a stale token,
            // and the caller's filter would mysteriously return 0 results.
            const qs = opts?.sneakPeek ? '?sneakPeek=true' : '';
            const res = await apiGet<{ items: any[]; total: number }>('/api/products' + qs, true);
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
              fit: p.fit ? (p.fit.charAt(0).toUpperCase() + p.fit.slice(1)) as Product['fit'] : 'Tailored',
              occasion: p.occasion || undefined,
              stock: p.stock ?? 0,
              lowStockThreshold: p.lowStockThreshold ?? 5,
              deliveryFee: p.deliveryFee ? Number(p.deliveryFee) : 2500,
              deluxeDiscount: p.deluxeDiscount ? Number(p.deluxeDiscount) : undefined,
              eliteDiscount: p.eliteDiscount ? Number(p.eliteDiscount) : undefined,
              inStock: p.inStock,
              published: p.published,
              isSneakPeek: !!p.isSneakPeek,
              sneakPeekReleasedAt: p.sneakPeekReleasedAt ?? undefined,
              createdAt: p.createdAt,
              updatedAt: p.updatedAt,
            }));
            set({ products: mapped, isLoading: false });
            return;
          }
          // Backend unreachable — show empty state, user can retry
          set({ products: [], isLoading: false });
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
