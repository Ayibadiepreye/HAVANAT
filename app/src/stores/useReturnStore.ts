// Returns store
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ReturnRequest, ReturnStatus } from '@/types/dashboard';
import { logAuditAction } from '@/utils/auditLogger';
import { apiConfig, apiGet } from '@/lib/api';
import { useAuthStore } from '@/stores/useAuthStore';

interface ReturnState {
  returns: ReturnRequest[];
  fetchReturns: () => Promise<void>;
  approve: (id: string, actor: { id: string; name: string; role: 'admin' | 'moderator' }) => void;
  reject: (id: string, actor: { id: string; name: string; role: 'admin' | 'moderator' }, reason: string) => void;
  assignRider: (id: string, riderId: string, riderName: string, actor: { id: string; name: string; role: 'admin' | 'moderator' }) => void;
  processRefund: (id: string, actor: { id: string; name: string; role: 'admin' | 'moderator' }, resalable?: boolean) => Promise<void>;
  setStatus: (id: string, status: ReturnStatus, note?: string) => void;
  getById: (id: string) => ReturnRequest | undefined;
}

export const useReturnStore = create<ReturnState>()(
  persist(
    (set, get) => ({
      returns: [],
      fetchReturns: async () => {
        if (!apiConfig.useBackend || !useAuthStore.getState().isAuthenticated) return;
        try {
          // Staff view: /api/admin/returns (all returns). Customer view: /api/returns/mine.
          const role = useAuthStore.getState().dashboardUser?.role;
          const url = (role === 'admin' || role === 'moderator') ? '/api/admin/returns' : '/api/returns/mine';
          const res = await apiGet<{ items: any[] }>(url, true);
          set({ returns: res.items.map((r) => ({
            id: String(r.id),
            orderId: String(r.orderId),
            customerId: String(r.userId ?? ''),
            customerName: r.customerName ?? '',
            customerPhone: r.customerPhone ?? '',
            description: r.reason ?? r.description ?? '',
            reason: r.reason ?? '',
            items: r.items ?? [],
            images: r.images ?? [],
            status: r.status as ReturnStatus,
            pickupAddress: r.pickupAddress ?? {},
            createdAt: r.createdAt,
            date: r.createdAt,
          })) });
        } catch (err) {
          console.error('fetchReturns failed', err);
        }
      },
      approve: (id, actor) => {
        const ret = get().returns.find((r) => r.id === id);
        if (!ret) return;
        const before = { status: ret.status };
        set({ returns: get().returns.map((r) => (r.id === id ? { ...r, status: 'approved' } : r)) });
        logAuditAction({
          userId: actor.id, userName: actor.name, userRole: actor.role,
          action: 'status_change', entityType: 'return', entityId: id, entityLabel: `Return ${id}`,
          summary: 'Approved return request',
          changes: { before, after: { status: 'approved' } },
        });
      },
      reject: (id, actor, reason) => {
        const ret = get().returns.find((r) => r.id === id);
        if (!ret) return;
        const before = { status: ret.status, adminNote: ret.adminNote };
        set({
          returns: get().returns.map((r) => (r.id === id ? { ...r, status: 'rejected', adminNote: reason } : r)),
        });
        logAuditAction({
          userId: actor.id, userName: actor.name, userRole: actor.role,
          action: 'status_change', entityType: 'return', entityId: id, entityLabel: `Return ${id}`,
          summary: `Rejected return: ${reason}`,
          changes: { before, after: { status: 'rejected', adminNote: reason } },
        });
      },
      assignRider: (id, riderId, riderName, actor) => {
        const ret = get().returns.find((r) => r.id === id);
        if (!ret) return;
        const before = { riderId: ret.riderId ?? null, status: ret.status };
        set({
          returns: get().returns.map((r) =>
            r.id === id ? { ...r, riderId, status: 'rider_scheduled' } : r
          ),
        });
        logAuditAction({
          userId: actor.id, userName: actor.name, userRole: actor.role,
          action: 'assign', entityType: 'return', entityId: id, entityLabel: `Return ${id}`,
          summary: `Assigned rider ${riderName} for pickup`,
          changes: { before, after: { riderId, status: 'rider_scheduled' } },
        });
      },
      processRefund: async (id, actor, resalable = true) => {
        const ret = get().returns.find((r) => r.id === id);
        if (!ret) return;
        const before = { status: ret.status };
        
        // STOCK RESTORATION: If items are resalable, add them back to stock
        if (resalable && ret.items && ret.items.length > 0) {
          const { useProductStore } = await import('@/stores/useProductStore');
          const productStore = useProductStore.getState();
          
          ret.items.forEach((item: any) => {
            const product = productStore.products.find((p) => p.id === item.productId);
            if (product) {
              const newStock = product.stock + (item.quantity || 1);
              const updatedProducts = productStore.products.map((p) =>
                p.id === item.productId ? { ...p, stock: newStock } : p
              );
              useProductStore.setState({ products: updatedProducts });
              
              // Audit log for stock restoration
              logAuditAction({
                userId: actor.id, userName: actor.name, userRole: actor.role,
                action: 'update', entityType: 'product', entityId: String(item.productId), 
                entityLabel: `Product: ${item.name || product.name}`,
                summary: `Stock restored: ${product.stock} → ${newStock} (Return ${id} - resalable)`,
                changes: { 
                  before: { stock: product.stock }, 
                  after: { stock: newStock } 
                },
              });
            }
          });
        }
        
        set({
          returns: get().returns.map((r) => (r.id === id ? { ...r, status: 'completed', adminNote: `Refund issued${resalable ? ' (items resalable)' : ' (items damaged)'}` } : r)),
        });
        logAuditAction({
          userId: actor.id, userName: actor.name, userRole: actor.role,
          action: 'status_change', entityType: 'return', entityId: id, entityLabel: `Return ${id}`,
          summary: `Processed refund and marked complete${resalable ? ' (stock restored)' : ' (no stock restoration)'}`,
          changes: { before, after: { status: 'completed', resalable } },
        });
      },
      setStatus: (id, status, note) => {
        set({ returns: get().returns.map((r) => (r.id === id ? { ...r, status, ...(note ? { adminNote: note } : {}) } : r)) });
      },
      getById: (id) => get().returns.find((r) => r.id === id),
    }),
    { name: 'havanat-returns' }
  )
);
