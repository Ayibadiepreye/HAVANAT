// Admin product store - extends useProductStore with admin CRUD
import { create } from 'zustand';
import { useProductStore } from '@/stores/useProductStore';
import type { Product } from '@/types';
import { logAuditAction } from '@/utils/auditLogger';

interface AdminProductState {
  addProduct: (product: Product, actor: { id: string; name: string; role: 'admin' | 'moderator' }) => void;
  updateProduct: (product: Product, actor: { id: string; name: string; role: 'admin' | 'moderator' }) => void;
  removeProduct: (productId: number, actor: { id: string; name: string; role: 'admin' | 'moderator' }) => void;
  toggleStatus: (productId: number, inStock: boolean, actor: { id: string; name: string; role: 'admin' | 'moderator' }) => void;
}

export const useAdminProductStore = create<AdminProductState>()(() => ({
  addProduct: (product, actor) => {
    const existing = useProductStore.getState();
    useProductStore.setState({ products: [...existing.products, product] });
    logAuditAction({
      userId: actor.id, userName: actor.name, userRole: actor.role,
      action: 'create', entityType: 'product', entityId: String(product.id), entityLabel: `Product: ${product.name}`,
      summary: `Added product (${product.category})`,
      changes: { before: null, after: { name: product.name, price: product.price } },
    });
  },
  updateProduct: (product, actor) => {
    const before = useProductStore.getState().products.find((p) => p.id === product.id);
    if (!before) return;
    useProductStore.setState({
      products: useProductStore.getState().products.map((p) => (p.id === product.id ? product : p)),
    });
    logAuditAction({
      userId: actor.id, userName: actor.name, userRole: actor.role,
      action: 'update', entityType: 'product', entityId: String(product.id), entityLabel: `Product: ${product.name}`,
      summary: 'Updated product',
      changes: { before: { ...before }, after: { ...product } },
    });
    // Low-stock notification: fire when stock crosses the threshold OR hits zero.
    // Mock: dispatches in-app broadcast to all admin/moderator accounts.
    // Backend cutover: server dispatches email via Resend to the staff list.
    const threshold = product.lowStockThreshold ?? 5;
    const wasOk = before.stock > threshold;
    const isLow = product.stock > 0 && product.stock <= threshold;
    const isOut = product.stock <= 0;
    if ((wasOk && (isLow || isOut))) {
      // Lazy-import to avoid circular: notification store imports order store
      import('@/stores/useNotificationStore').then(({ useNotificationStore }) => {
        const notif = useNotificationStore.getState();
        const title = isOut ? `${product.name} is now out of stock` : `${product.name} is low on stock (${product.stock} left)`;
        notif.broadcast(
          {
            title,
            body: isOut
              ? `${product.name} just hit zero stock. Customers can no longer add it to cart. Restock and update the count to re-enable sales.`
              : `${product.name} is at ${product.stock} units. Threshold is ${threshold}. Consider restocking soon.`,
            category: 'system',
            channels: 'email',
            scope: 'all',
          },
          actor
        );
      });
    }
  },
  removeProduct: (productId, actor) => {
    const before = useProductStore.getState().products.find((p) => p.id === productId);
    if (!before) return;
    useProductStore.setState({
      products: useProductStore.getState().products.filter((p) => p.id !== productId),
    });
    logAuditAction({
      userId: actor.id, userName: actor.name, userRole: actor.role,
      action: 'delete', entityType: 'product', entityId: String(productId), entityLabel: `Product: ${before.name}`,
      summary: 'Removed product',
      changes: { before: { name: before.name }, after: null },
    });
  },
  toggleStatus: (productId, inStock, actor) => {
    const before = useProductStore.getState().products.find((p) => p.id === productId);
    if (!before) return;
    useProductStore.setState({
      products: useProductStore.getState().products.map((p) => (p.id === productId ? { ...p, inStock } : p)),
    });
    logAuditAction({
      userId: actor.id, userName: actor.name, userRole: actor.role,
      action: 'update', entityType: 'product', entityId: String(productId), entityLabel: `Product: ${before.name}`,
      summary: `Set stock status to ${inStock ? 'in stock' : 'out of stock'}`,
      changes: { before: { inStock: before.inStock }, after: { inStock } },
    });
  },
}));
