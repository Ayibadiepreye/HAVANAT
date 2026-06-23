// Orders store - holds all dashboard orders
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { DashboardOrder, OrderStatus, TrackingEvent } from '@/types/dashboard';
import { ORDERS as SEED_ORDERS } from '@/data/dashboardMockData';
import { logAuditAction } from '@/utils/auditLogger';

interface OrderState {
  orders: DashboardOrder[];
  updateStatus: (id: string, status: OrderStatus, actor: { id: string; name: string; role: 'admin' | 'moderator' }, note?: string) => void;
  assignRider: (id: string, riderId: string, riderName: string, actor: { id: string; name: string; role: 'admin' | 'moderator' }) => void;
  cancelOrder: (id: string, actor: { id: string; name: string; role: 'admin' | 'moderator' }, note?: string) => void;
  getById: (id: string) => DashboardOrder | undefined;
  getByRider: (riderId: string) => DashboardOrder[];
}

export const useOrderStore = create<OrderState>()(
  persist(
    (set, get) => ({
      orders: SEED_ORDERS,
      updateStatus: (id, status, actor, note) => {
        const order = get().orders.find((o) => o.id === id);
        if (!order) return;
        const before = { status: order.status, riderId: order.riderId };
        const newEvent: TrackingEvent = { status, timestamp: new Date().toISOString(), note };
        set({
          orders: get().orders.map((o) =>
            o.id === id ? { ...o, status, trackingHistory: [...o.trackingHistory, newEvent] } : o
          ),
        });
        const after = { status, riderId: get().orders.find((o) => o.id === id)?.riderId };
        logAuditAction({
          userId: actor.id, userName: actor.name, userRole: actor.role,
          action: status === 'cancelled' ? 'update' : 'status_change',
          entityType: 'order', entityId: id, entityLabel: `Order ${id}`,
          summary: `Updated status to ${status}${note ? ` (${note})` : ''}`,
          changes: { before, after },
        });
      },
      assignRider: (id, riderId, riderName, actor) => {
        const order = get().orders.find((o) => o.id === id);
        if (!order) return;
        const before = { riderId: order.riderId ?? null };
        set({ orders: get().orders.map((o) => (o.id === id ? { ...o, riderId } : o)) });
        logAuditAction({
          userId: actor.id, userName: actor.name, userRole: actor.role,
          action: 'assign', entityType: 'order', entityId: id, entityLabel: `Order ${id}`,
          summary: `Assigned rider ${riderName}`,
          changes: { before, after: { riderId } },
        });
      },
      cancelOrder: (id, actor, note) => {
        get().updateStatus(id, 'cancelled', actor, note ?? 'Cancelled by admin');
      },
      getById: (id) => get().orders.find((o) => o.id === id),
      getByRider: (riderId) => get().orders.filter((o) => o.riderId === riderId),
    }),
    { name: 'havanat-orders' }
  )
);
