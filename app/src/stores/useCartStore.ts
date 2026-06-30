import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem, Product } from '@/types';
import { CONFIG } from '@/config';

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  /** Customer's selected delivery state. Used for the zone-based delivery fee. */
  deliveryState: string;
  addItem: (product: Product, size: string, quantity?: number) => void;
  removeItem: (productId: number, size: string) => void;
  updateQuantity: (productId: number, size: string, quantity: number) => void;
  clearCart: () => void;
  toggleCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  setDeliveryState: (state: string) => void;
  validateStock: (products: Product[]) => { removed: CartItem[]; updated: CartItem[] };
  totalItems: () => number;
  /** Sum of line-item price × qty BEFORE any tier discount. */
  subtotal: () => number;
  /** Total discount amount applied based on the customer's membership tier. */
  tierDiscount: (tier?: 'standard' | 'deluxe' | 'elite') => number;
  /** Subtotal after applying tier discounts. */
  discountedSubtotal: (tier?: 'standard' | 'deluxe' | 'elite') => number;
  /**
   * Total delivery fee.
   * Formula: for each line item, take the larger of (product.deliveryFee) or the
   * zone-based fee for the customer's selected delivery state. Multiply by qty.
   * If neither is set, fall back to CONFIG.DEFAULT_DELIVERY_FEE.
   */
  deliveryFee: (zoneFeeByState: Record<string, number>) => number;
  /** Total = discountedSubtotal + deliveryFee. */
  total: (tier?: 'standard' | 'deluxe' | 'elite', zoneFeeByState?: Record<string, number>) => number;
}

const DEFAULT_DELUXE_DISCOUNT = 0.05;
const DEFAULT_ELITE_DISCOUNT = 0.10;

function discountFor(product: Product, tier?: 'standard' | 'deluxe' | 'elite'): number {
  if (tier === 'deluxe') return product.deluxeDiscount ?? DEFAULT_DELUXE_DISCOUNT;
  if (tier === 'elite') return product.eliteDiscount ?? DEFAULT_ELITE_DISCOUNT;
  return 0;
}

function perUnitDeliveryFeeFor(product: Product): number | null {
  return typeof product.deliveryFee === 'number' && product.deliveryFee >= 0
    ? product.deliveryFee
    : null;
}

function feeForItem(product: Product, qty: number, state: string, zoneFeeByState: Record<string, number>): number {
  const perUnit = perUnitDeliveryFeeFor(product);
  const zone = state ? zoneFeeByState[state] ?? zoneFeeByState['Other States'] ?? CONFIG.DEFAULT_DELIVERY_FEE : CONFIG.DEFAULT_DELIVERY_FEE;
  // Take the max — admins set the per-item fee to reflect the real cost, and
  // the zone fee reflects distance. We never charge less than the platform default.
  const fee = Math.max(perUnit ?? 0, zone ?? CONFIG.DEFAULT_DELIVERY_FEE);
  return fee * qty;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      deliveryState: '',

      addItem: (product, size, quantity = 1) => {
        const currentStock = product.stock ?? 0;
        if (currentStock <= 0) return; // out of stock guard
        const { items } = get();
        const existing = items.find(
          (item) => item.product.id === product.id && item.size === size
        );
        if (existing) {
          set({
            items: items.map((item) =>
              item.product.id === product.id && item.size === size
                ? { ...item, quantity: Math.min(item.quantity + quantity, currentStock) }
                : item
            ),
          });
        } else {
          set({ items: [...items, { product, size, quantity: Math.min(quantity, currentStock) }] });
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
        const item = get().items.find(i => i.product.id === productId && i.size === size);
        const maxStock = item ? (item.product.stock ?? 0) : 0;
        set({
          items: get().items.map((item) =>
            item.product.id === productId && item.size === size
              ? { ...item, quantity: Math.min(quantity, maxStock) }
              : item
          ),
        });
      },

      clearCart: () => set({ items: [] }),
      toggleCart: () => set((s) => ({ isOpen: !s.isOpen })),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      setDeliveryState: (state) => set({ deliveryState: state }),

      validateStock: (products: Product[]) => {
        const items = get().items;
        const productMap = new Map(products.map(p => [p.id, p]));
        const removed: CartItem[] = [];
        const updated: CartItem[] = [];
        
        const validItems = items.filter(item => {
          const latestProduct = productMap.get(item.product.id);
          if (!latestProduct) {
            removed.push(item);
            return false;
          }
          
          const currentStock = latestProduct.stock ?? 0;
          
          // Remove if out of stock
          if (currentStock <= 0 || !latestProduct.inStock) {
            removed.push(item);
            return false;
          }
          
          // Adjust quantity if exceeds available stock
          if (item.quantity > currentStock) {
            updated.push({ ...item, quantity: currentStock });
            return true;
          }
          
          return true;
        });
        
        // Update cart with valid items and adjusted quantities
        set({
          items: validItems.map(item => {
            const updatedItem = updated.find(u => u.product.id === item.product.id && u.size === item.size);
            return updatedItem || item;
          })
        });
        
        return { removed, updated };
      },

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

      deliveryFee: (zoneFeeByState?: Record<string, number>) => {
        const map = zoneFeeByState ?? {};
        const items = get().items;
        if (items.length === 0) return 0;
        return items.reduce((sum, item) => sum + feeForItem(item.product, item.quantity, get().deliveryState, map), 0);
      },

      total: (tier, zoneFeeByState) => get().discountedSubtotal(tier) + get().deliveryFee(zoneFeeByState ?? {}),
    }),
    { name: 'havanat-cart' }
  )
);