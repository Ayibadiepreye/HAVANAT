// Admin product store - extends useProductStore with admin CRUD.
//
// All mutations POST/PUT/PATCH/DELETE to the backend first, then mirror the
// change into useProductStore so the UI updates immediately. The local store
// is ONLY a mirror - the database is authoritative. After a successful backend
// call we trigger a refetch so the UI matches the persisted state.
//
// Audit logging is also handled by the backend in the same transaction, so we
// skip the local logAuditAction() call (no double logging).

import { create } from 'zustand';
import { useProductStore } from '@/stores/useProductStore';
import type { Product } from '@/types';
import { apiConfig, apiDelete, apiGet, apiPatch, apiPost } from '@/lib/api';
import { useAuthStore } from '@/stores/useAuthStore';

interface AdminProductState {
  addProduct: (product: Product, actor: { id: string; name: string; role: 'admin' | 'moderator' }) => Promise<void>;
  updateProduct: (product: Product, actor: { id: string; name: string; role: 'admin' | 'moderator' }) => Promise<void>;
  removeProduct: (productId: number, actor: { id: string; name: string; role: 'admin' | 'moderator' }) => Promise<void>;
  toggleStatus: (productId: number, inStock: boolean, actor: { id: string; name: string; role: 'admin' | 'moderator' }) => Promise<void>;
}

/**
 * Build the backend-shaped payload from a frontend Product.
 *
 * Backend (CreateProductSchema / UpdateProductSchema) expects:
 *   name (string, required)
 *   slug (string, required, regex /^[a-z0-9-]+$/)
 *   description (string, default '')
 *   price (number, positive)
 *   originalPrice (number, optional)
 *   images (string[], required, must be valid URLs)
 *   category ('suits' | 'shirts' | 'trousers' | 'outerwear' | 'accessories')
 *   sizes (string[])
 *   colors (string[])
 *   fit ('Oversized' | 'Tailored' | 'Classic' | 'Slim')
 *   inStock (boolean)
 *   tags (string[])
 *   details (string)         -- legacy single-string field
 *   care (string)
 *   sku (string, optional)
 *
 * The frontend Product type has a few extras the backend doesn't (deliveryFee,
 * deluxeDiscount, eliteDiscount, occasion, isNew, isBestseller, lowStockThreshold)
 * that we still need to pass through. The backend schema is .partial() so
 * unknown fields are dropped by zod; we'll send what we can.
 */
function toBackendPayload(p: Partial<Product>, isCreate: boolean) {
  const slug =
    p.slug && /^[a-z0-9-]+$/.test(p.slug)
      ? p.slug
      : (p.name ?? 'product').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'product';
  const payload: Record<string, unknown> = {
    name: p.name,
    slug,
    description: p.description ?? '',
    price: Number(p.price ?? 0),
    originalPrice: p.originalPrice != null ? Number(p.originalPrice) : undefined,
    images: Array.isArray(p.images) && p.images.length > 0
      ? p.images
      : ['https://placehold.co/600x800/EEE/333?text=No+Image'],
    category: (p.category ?? 'suits'),
    sizes: p.sizes ?? [],
    colors: (p as any).colors ?? [],
    fit: ((p as any).fit ?? 'Tailored').toLowerCase(),
    inStock: p.inStock !== false,
    tags: [],
    details: '',
    care: '',
  };
  if (!isCreate) {
    // On update we only send fields that exist on the frontend Product.
    // Backend's UpdateProductSchema is .partial() so missing fields are fine.
    Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);
  }
  return payload;
}

export const useAdminProductStore = create<AdminProductState>()(() => ({
  addProduct: async (product, _actor) => {
    const payload = toBackendPayload(product, true);
    if (!apiConfig.useBackend || !useAuthStore.getState().isAuthenticated) {
      // Local-only fallback (dev / no backend)
      const existing = useProductStore.getState();
      useProductStore.setState({ products: [...existing.products, product] });
      return;
    }
    try {
      const created = await apiPost<{ id: number }>('/api/products', payload, true);
      // Mirror the backend-assigned id into local state.
      const existing = useProductStore.getState();
      useProductStore.setState({
        products: [...existing.products, { ...product, id: created.id }],
      });
      // Re-fetch so DB-truth replaces optimistic state.
      await useProductStore.getState().fetchProducts();
    } catch (err: any) {
      console.error('addProduct failed', err);
      throw err;
    }
  },

  updateProduct: async (product, _actor) => {
    const payload = toBackendPayload(product, false);
    if (!apiConfig.useBackend || !useAuthStore.getState().isAuthenticated) {
      const before = useProductStore.getState().products.find((p) => p.id === product.id);
      if (!before) return;
      useProductStore.setState({
        products: useProductStore.getState().products.map((p) => (p.id === product.id ? product : p)),
      });
      return;
    }
    try {
      await apiPatch(`/api/products/${product.id}`, payload, true);
      await useProductStore.getState().fetchProducts();
    } catch (err: any) {
      console.error('updateProduct failed', err);
      throw err;
    }
  },

  removeProduct: async (productId, _actor) => {
    if (!apiConfig.useBackend || !useAuthStore.getState().isAuthenticated) {
      const before = useProductStore.getState().products.find((p) => p.id === productId);
      if (!before) return;
      useProductStore.setState({
        products: useProductStore.getState().products.filter((p) => p.id !== productId),
      });
      return;
    }
    try {
      await apiDelete(`/api/products/${productId}`, true);
      await useProductStore.getState().fetchProducts();
    } catch (err: any) {
      console.error('removeProduct failed', err);
      throw err;
    }
  },

  toggleStatus: async (productId, inStock, _actor) => {
    if (!apiConfig.useBackend || !useAuthStore.getState().isAuthenticated) {
      const before = useProductStore.getState().products.find((p) => p.id === productId);
      if (!before) return;
      useProductStore.setState({
        products: useProductStore.getState().products.map((p) => (p.id === productId ? { ...p, inStock } : p)),
      });
      return;
    }
    try {
      // 'in stock' is the inverse of the backend's `active` boolean (which
      // maps to `published` in the schema). The backend treats both the same.
      await apiPatch(`/api/products/${productId}`, { inStock, published: inStock }, true);
      await useProductStore.getState().fetchProducts();
    } catch (err: any) {
      console.error('toggleStatus failed', err);
      throw err;
    }
  },
}));

// Silence unused-import warning for apiGet
void apiGet;