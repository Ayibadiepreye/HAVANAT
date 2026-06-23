// Rider roster + delivery store
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Rider, RiderStatus, Delivery, DeliveryStatus } from '@/types/dashboard';
import type { ProofOfDelivery } from '@/types/dashboard';
import { RIDERS as SEED_RIDERS, DELIVERIES as SEED_DELIVERIES } from '@/data/dashboardMockData';
import { logAuditAction } from '@/utils/auditLogger';

interface RiderState {
  riders: Rider[];
  deliveries: Delivery[];
  addRider: (rider: Omit<Rider, 'id' | 'rating' | 'totalDeliveries' | 'totalEarnings' | 'joinedAt'>, actor: { id: string; name: string; role: 'admin' | 'moderator' }) => void;
  setStatus: (riderId: string, status: RiderStatus, actor: { id: string; name: string; role: 'admin' | 'moderator' }) => void;
  removeRider: (riderId: string, actor: { id: string; name: string; role: 'admin' | 'moderator' }) => void;
  updateDeliveryStatus: (deliveryId: string, status: DeliveryStatus, proof?: ProofOfDelivery) => void;
  setDeliveryProof: (deliveryId: string, proof: ProofOfDelivery) => void;
  getRiderById: (riderId: string) => Rider | undefined;
  getDeliveriesByRider: (riderId: string) => Delivery[];
  getDeliveryById: (id: string) => Delivery | undefined;
}

export const useRiderStore = create<RiderState>()(
  persist(
    (set, get) => ({
      riders: SEED_RIDERS,
      deliveries: SEED_DELIVERIES,
      addRider: (rider, actor) => {
        const id = `rider-${Date.now()}`;
        const newRider: Rider = {
          ...rider,
          id,
          rating: 5.0,
          totalDeliveries: 0,
          totalEarnings: 0,
          joinedAt: new Date().toISOString(),
        };
        set({ riders: [...get().riders, newRider] });
        logAuditAction({
          userId: actor.id, userName: actor.name, userRole: actor.role,
          action: 'create', entityType: 'rider', entityId: id, entityLabel: `Rider: ${rider.name}`,
          summary: `Onboarded new rider (${rider.vehicleType})`,
          changes: { before: null, after: { name: rider.name, vehicleType: rider.vehicleType } },
        });
      },
      setStatus: (riderId, status, actor) => {
        const rider = get().riders.find((r) => r.id === riderId);
        if (!rider) return;
        const before = { status: rider.status };
        set({ riders: get().riders.map((r) => (r.id === riderId ? { ...r, status } : r)) });
        logAuditAction({
          userId: actor.id, userName: actor.name, userRole: actor.role,
          action: 'update', entityType: 'rider', entityId: riderId, entityLabel: `Rider: ${rider.name}`,
          summary: `Set rider status to ${status}`,
          changes: { before, after: { status } },
        });
      },
      removeRider: (riderId, actor) => {
        const rider = get().riders.find((r) => r.id === riderId);
        if (!rider) return;
        set({ riders: get().riders.filter((r) => r.id !== riderId) });
        logAuditAction({
          userId: actor.id, userName: actor.name, userRole: actor.role,
          action: 'delete', entityType: 'rider', entityId: riderId, entityLabel: `Rider: ${rider.name}`,
          summary: 'Removed rider from roster',
          changes: { before: { name: rider.name }, after: null },
        });
      },
      updateDeliveryStatus: (deliveryId, status, proof) => {
        set({
          deliveries: get().deliveries.map((d) =>
            d.id === deliveryId
              ? {
                  ...d,
                  status,
                  ...(status === 'delivered' ? { completedAt: new Date().toISOString() } : {}),
                  ...(proof ? { proofOfDelivery: proof } : {}),
                }
              : d
          ),
        });
      },
      setDeliveryProof: (deliveryId, proof) => {
        set({
          deliveries: get().deliveries.map((d) =>
            d.id === deliveryId ? { ...d, proofOfDelivery: proof } : d
          ),
        });
      },
      getRiderById: (riderId) => get().riders.find((r) => r.id === riderId),
      getDeliveriesByRider: (riderId) => get().deliveries.filter((d) => d.riderId === riderId),
      getDeliveryById: (id) => get().deliveries.find((d) => d.id === id),
    }),
    { name: 'havanat-riders' }
  )
);
