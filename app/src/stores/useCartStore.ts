import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem, Product } from '@/types';
import { CONFIG } from '@/config';

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  addItem: (product: Product, size: string, quantity?: number) => void;
  removeItem: (productId: number, size: string) => void;
  updateQuantity: (productId: number, size: string, quantity: number) => void;
  clearCart: () => void;
  toggleCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  totalItems: () => number;
  /** Sum of line-item price × qty BEFORE any tier discount. */
  subtotal: () => number;
  /** Total discount amount applied based on the customer's membership tier. */
  tierDiscount: (tier?: 'standard' | 'deluxe' | 'elite') => number;
  /** Subtotal after applying tier discounts. */
  discountedSubtotal: (tier?: 'standard' | 'deluxe' | 'elite') => number;
  /** Delivery fee — flat rate, no free delivery. */
  deliveryFee: () => number;
  /** Total = discountedSubtotal + deliveryFee. */
  total: (tier?: 'standard' | 'deluxe' | 'elite') => number;
}

const DEFAULT_DELUXE_DISCOUNT = 0.05; // 5%
const DEFAULT_ELITE_DISCOUNT = 0.10;  // 10%

function discountFor(product: Product, tier?: 'standard' | 'deluxe' | 'elite'): number {
  if (tier === 'deluxe') return product.deluxeDiscount ?? DEFAULT_DELUXE_DISCOUNT;
  if (tier === 'elite') return product.eliteDiscount ?? DEFAULT_ELITE_DISCOUNT;
  return 0;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addItem: (product, size, quantity = 1) => {
        const { items } = get();
        const existing = items.find(
          (item) => item.product.id === product.id && item.size === size
        );
        if (existing) {
          set({
            items: items.map((item) =>
              item.product.id === product.id && item.size === size
                ? { ...item, quantity: item.quantity + quantity }
                : item
            ),
          });
        } else {
          set({ items: [...items, { product, size, quantity }] });
        }
        set({ isOpen: true });
      },

      removeItem: (productId, size) => {
        set({
          items: get().items.filter(
            (item) => !(item.product.id === productId && item.size === size)
          ),
        });
      },

      updateQuantity: (productId, size, quantity) => {
        if (quantity < 1) {
          get().removeItem(productId, size);
          return;
        }
        set({
          items: get().items.map((item) =>
            item.product.id === productId && item.size === size
              ? { ...item, quantity }
              : item
          ),
        });
      },

      clearCart: () => set({ items: [] }),
      toggleCart: () => set((s) => ({ isOpen: !s.isOpen })),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),

      totalItems: () => get().items.reduce((sum, item) => sum + item.quantity, 0),

      subtotal: () =>
        get().items.reduce((sum, item) => sum + item.product.price * item.quantity, 0),

      tierDiscount: (tier) => {
        if (!tier || tier === 'standard') return 0;
        return get().items.reduce((sum, item) => {
          const d = discountFor(item.product, tier);
          return sum + item.product.price * item.quantity * d;
        }, 0);
      },

      discountedSubtotal: (tier) => get().subtotal() - get().tierDiscount(tier),

      deliveryFee: () => CONFIG.DEFAULT_DELIVERY_FEE,

      total: (tier) => get().discountedSubtotal(tier) + get().deliveryFee(),
    }),
    { name: 'havanat-cart' }
  )
);