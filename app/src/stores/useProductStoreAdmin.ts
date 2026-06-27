// Admin product store - extends useProductStore with admin CRUD.
//
// All mutations POST/PUT/DELETE to the backend first, then mirror the change
// into useProductStore so the UI updates immediately. The local store is
// ONLY a mirror - the database is authoritative. After a successful backend
// call we trigger a refetch so the UI matches the persisted state.
//
// Audit logging is also handled by the backend in the same transaction, so we
// skip the local logAuditAction() call (no double logging).

import { create } from 'zustand';
import { useProductStore } from '@/stores/useProductStore';
import type { Product } from '@/types';
import { apiConfig, apiDelete, apiPatch, apiPost } from '@/lib/api';
import { useAuthStore } from '@/stores/useAuthStore';

interface AdminProductState {
  addProduct: (product: Product, actor: { id: string; name: string; role: 'admin' | 'moderator' }) => Promise<void>;
  updateProduct: (product: Product, actor: { id: string; name: string; role: 'admin' | 'moderator' }) => Promise<void>;
  removeProduct: (productId: number, actor: { id: string; name: string; role: 'admin' | 'moderator' }) => Promise<void>;
  toggleStatus: (productId: number, inStock: boolean, actor: { id: string; name: string; role: 'admin' | 'moderator' }) => Promise<void>;
}

export const useAdminProductStore = create<AdminProductState>()(() => ({
  addProduct: async (product, _actor) => {
    if (!apiConfig.useBackend || !useAuthStore.getState().isAuthenticated) {
      // Fall back to local-only when backend is unavailable.
      const existing = useProductStore.getState();
      useProductStore.setState({ products: [...existing.products, product] });
      return;
    }
    await apiPost('/api/products', {
      name: product.name,
      description: product.description,
      price: product.price,
      category: product.category,
      images: product.images,
      sizes: product.sizes,
      stock: product.stock,
      lowStockThreshold: product.lowStockThreshold ?? 5,
      active: product.inStock !== false,
    }, true);
    // Refetch so the row gets its backend-assigned id.
    await useProductStore.getState().fetchProducts();
  },

  updateProduct: async (product, _actor) => {
    if (!apiConfig.useBackend || !useAuthStore.getState().isAuthenticated) {
      const before = useProductStore.getState().products.find((p) => p.id === product.id);
      if (!before) return;
      useProductStore.setState({
        products: useProductStore.getState().products.map((p) => (p.id === product.id ? product : p)),
      });
      return;
    }
    await apiPatch(`/api/products/${product.id}`, {
      name: product.name,
      description: product.description,
      price: product.price,
      category: product.category,
      images: product.images,
      sizes: product.sizes,
      stock: product.stock,
      lowStockThreshold: product.lowStockThreshold ?? 5,
      active: product.inStock !== false,
    }, true);
    await useProductStore.getState().fetchProducts();
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
    await apiDelete(`/api/products/${productId}`, true);
    await useProductStore.getState().fetchProducts();
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
    // 'in stock' is the inverse of the backend's `active` boolean.
    await apiPatch(`/api/products/${productId}`, { active: inStock }, true);
    await useProductStore.getState().fetchProducts();
  },
}));