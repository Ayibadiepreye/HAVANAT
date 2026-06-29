// Rider roster + delivery store
import { create } from 'zustand';
import type { Rider, RiderStatus, Delivery, DeliveryStatus } from '@/types/dashboard';
import type { ProofOfDelivery } from '@/types/dashboard';
import { logAuditAction } from '@/utils/auditLogger';
import { apiConfig, apiGet, apiPatch } from '@/lib/api';
import { useAuthStore } from '@/stores/useAuthStore';

interface RiderState {
  fetchRiders: () => Promise<void>;
  fetchMyDeliveries: () => Promise<void>;
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
  (set, get) => ({
      riders: [],
      deliveries: [],
      fetchRiders: async () => {
        if (!apiConfig.useBackend || !useAuthStore.getState().isAuthenticated) return;
        try {
          // Admin/moderator view: use /api/admin/riders which joins users + rider_profiles.
          // Rider self-view: use /api/riders which is scoped to the current user.
          const isStaff = useAuthStore.getState().dashboardUser?.role !== 'rider';
          const url = isStaff ? '/api/admin/riders' : '/api/riders';
          const res = await apiGet<{ items: any[] }>(url, true);
          set({ riders: res.items.map((r) => ({ 
            id: String(r.id), 
            name: r.name, 
            email: r.email ?? '',
            phone: r.phone ?? '', 
            address: r.address ?? '',
            vehicleType: r.vehicleType ?? 'bike',
            plateNumber: r.plateNumber ?? '',
            status: r.status ?? 'active', 
            idVerified: r.idVerified ?? false,
            rating: Number(r.rating ?? 5), 
            totalDeliveries: Number(r.totalDeliveries ?? 0), 
            pendingDeliveries: Number(r.pendingDeliveries ?? 0),
            deliveredDeliveries: Number(r.deliveredDeliveries ?? 0),
            joinedAt: r.joinedAt ?? new Date().toISOString(),
          })) as any });
        } catch (err) {
          console.error('fetchRiders failed', err);
        }
      },
      fetchMyDeliveries: async () => {
        if (!apiConfig.useBackend || !useAuthStore.getState().isAuthenticated) return;
        try {
          const res = await apiGet<{ items: any[] }>('/api/riders/me/deliveries', true);
          set({ deliveries: res.items.map((d) => ({
            id: String(d.id),
            orderId: String(d.orderId),
            riderId: d.riderId != null ? String(d.riderId) : '',
            type: d.type || 'delivery',
            customerName: d.customerName ?? '',
            customerPhone: d.customerPhone ?? '',
            address: d.address?.street ?? '',
            city: d.address?.city ?? '',
            state: d.address?.state ?? '',
            itemSummary: `Order #${d.orderNumber}`,
            itemCount: 1,
            scheduledFor: d.assignedAt ?? new Date().toISOString(),
            status: d.status ?? 'assigned',
            deliveryOtp: d.deliveryOtp ?? '',
            deliveryFee: 2500,
            eta: d.eta,
            assignedAt: d.assignedAt ?? new Date().toISOString()
          })) as any });
        } catch (err) {
          console.error('fetchMyDeliveries failed', err);
        }
      },
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
      updateDeliveryStatus: async (deliveryId, status, proof) => {
        // Optimistically update UI
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
        
        // Call backend to persist
        if (apiConfig.useBackend && useAuthStore.getState().isAuthenticated) {
          try {
            await apiPatch(`/api/riders/me/deliveries/${deliveryId}/status`, {
              status,
              proofPhotoUrl: proof?.photoUrl,
              proofSignatureUrl: proof?.signatureDataUrl,
            }, true);
            // Refetch to ensure sync
            await get().fetchMyDeliveries();
          } catch (err) {
            console.error('updateDeliveryStatus backend failed', err);
          }
        }
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
);
