// Orders store - holds all dashboard orders
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { DashboardOrder, OrderStatus, TrackingEvent } from '@/types/dashboard';
import { ORDERS as SEED_ORDERS } from '@/data/dashboardMockData';
import { logAuditAction } from '@/utils/auditLogger';

interface Actor {
  id: string;
  name: string;
  role: 'admin' | 'moderator' | 'rider';
}

interface OrderState {
  orders: DashboardOrder[];
  updateStatus: (id: string, status: OrderStatus, actor: Actor, note?: string) => void;
  assignRider: (id: string, riderId: string, riderName: string, actor: Actor) => void;
  cancelOrder: (id: string, actor: Actor, note?: string) => void;
  /** Generate the 4-digit delivery OTP when an order moves to `processing`. */
  generateDeliveryOtp: (id: string, actor: Actor) => string | null;
  /** Verify a customer-entered OTP. Marks the order `delivered` on success. */
  verifyDeliveryOtp: (id: string, otp: string, actor: Actor) => { ok: boolean; reason?: string };
  getById: (id: string) => DashboardOrder | undefined;
  getByRider: (riderId: string) => DashboardOrder[];
  /** Customer-side: list orders for a given customer email. */
  getByCustomer: (customerEmail: string) => DashboardOrder[];
}

/** Random 4-digit OTP that doesn't start with 0 (so it's always 4 chars). */
function newOtp(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

export const useOrderStore = create<OrderState>()(
  persist(
    (set, get) => ({
      orders: SEED_ORDERS,
      updateStatus: (id, status, actor, note) => {
        const order = get().orders.find((o) => o.id === id);
        if (!order) return;
        const before = { status: order.status, riderId: order.riderId, deliveryOtp: order.deliveryOtp ?? null };
        const newEvent: TrackingEvent = { status, timestamp: new Date().toISOString(), note };
        // If the order just moved into `processing`, mint a fresh delivery OTP.
        const deliveryOtp =
          status === 'processing' && !order.deliveryOtp ? newOtp() : order.deliveryOtp;
        set({
          orders: get().orders.map((o) =>
            o.id === id
              ? { ...o, status, deliveryOtp, trackingHistory: [...o.trackingHistory, newEvent] }
              : o
          ),
        });
        const updated = get().orders.find((o) => o.id === id);
        const after = { status: updated?.status, riderId: updated?.riderId, deliveryOtp: updated?.deliveryOtp ?? null };
        logAuditAction({
          userId: actor.id, userName: actor.name, userRole: actor.role,
          action: status === 'cancelled' ? 'update' : 'status_change',
          entityType: 'order', entityId: id, entityLabel: `Order ${id}`,
          summary: `Updated status to ${status}${note ? ` (${note})` : ''}`,
          changes: { before, after },
        });
        // Mock: send OTP to customer email when one is generated
        if (status === 'processing' && deliveryOtp && deliveryOtp !== before.deliveryOtp) {
          // Real implementation would email the customer here.
          // eslint-disable-next-line no-console
          console.info(`[mock-email] To: ${order.customerEmail} — Your Havanat delivery OTP is ${deliveryOtp}. Show this to the rider on arrival.`);
        }
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
      generateDeliveryOtp: (id, actor) => {
        const order = get().orders.find((o) => o.id === id);
        if (!order) return null;
        if (order.deliveryOtp) return order.deliveryOtp;
        const otp = newOtp();
        set({ orders: get().orders.map((o) => (o.id === id ? { ...o, deliveryOtp: otp } : o)) });
        logAuditAction({
          userId: actor.id, userName: actor.name, userRole: actor.role,
          action: 'update', entityType: 'order', entityId: id, entityLabel: `Order ${id}`,
          summary: `Generated delivery OTP`,
          changes: { before: { deliveryOtp: null }, after: { deliveryOtp: otp } },
        });
        return otp;
      },
      verifyDeliveryOtp: (id, otp, actor) => {
        const order = get().orders.find((o) => o.id === id);
        if (!order) return { ok: false, reason: 'Order not found' };
        if (!order.deliveryOtp) return { ok: false, reason: 'No OTP issued yet' };
        if (order.deliveryOtp !== otp) return { ok: false, reason: 'OTP does not match' };
        get().updateStatus(id, 'delivered', actor, 'Customer verified OTP');
        return { ok: true };
      },
      getById: (id) => get().orders.find((o) => o.id === id),
      getByRider: (riderId) => get().orders.filter((o) => o.riderId === riderId),
      getByCustomer: (customerEmail) =>
        get().orders.filter((o) => o.customerEmail.toLowerCase() === customerEmail.toLowerCase()),
    }),
    { name: 'havanat-orders' }
  )
);