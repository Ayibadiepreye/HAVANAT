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
  subtotal: () => number;
  deliveryFee: () => number;
  total: () => number;
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
        get().items.reduce(
          (sum, item) => sum + item.product.price * item.quantity,
          0
        ),

      deliveryFee: () => {
        const sub = get().subtotal();
        return sub >= CONFIG.FREE_DELIVERY_THRESHOLD ? 0 : CONFIG.DEFAULT_DELIVERY_FEE;
      },

      total: () => get().subtotal() + get().deliveryFee(),
    }),
    { name: 'havanat-cart' }
  )
);
