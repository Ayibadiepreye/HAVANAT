// Delivery zone + email template + branding store
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { DeliveryZone } from '@/types/dashboard';
import { DELIVERY_ZONES as SEED_ZONES } from '@/data/dashboardMockData';
import { logAuditAction } from '@/utils/auditLogger';
import { apiConfig, apiGet } from '@/lib/api';
import { useAuthStore } from '@/stores/useAuthStore';

interface DeliveryZoneState {
  zones: DeliveryZone[];
  fetchZones: () => Promise<void>;
  addZone: (z: Omit<DeliveryZone, 'id'>, actor: { id: string; name: string; role: 'admin' | 'moderator' }) => void;
  updateZone: (id: string, z: Partial<DeliveryZone>, actor: { id: string; name: string; role: 'admin' | 'moderator' }) => void;
  removeZone: (id: string, actor: { id: string; name: string; role: 'admin' | 'moderator' }) => void;
}

export const useDeliveryZoneStore = create<DeliveryZoneState>()(
  persist(
    (set, get) => ({
      zones: SEED_ZONES,
      fetchZones: async () => {
        if (!apiConfig.useBackend || !useAuthStore.getState().isAuthenticated) return;
        try {
          const res = await apiGet<{ items: any[] }>('/api/content/delivery-zones', true);
          set({ zones: res.items.map((z) => ({ id: String(z.id), state: z.state, fee: Number(z.fee), eta: z.eta })) });
        } catch (err) {
          console.error('fetchZones failed', err);
        }
      },
      addZone: (z, actor) => {
        const id = `zone-${Date.now()}`;
        set({ zones: [...get().zones, { ...z, id }] });
        logAuditAction({
          userId: actor.id, userName: actor.name, userRole: actor.role,
          action: 'create', entityType: 'settings', entityId: id, entityLabel: `Delivery zone: ${z.state}`,
          summary: 'Added delivery zone',
          changes: { before: null, after: z },
        });
      },
      updateZone: (id, z, actor) => {
        const before = get().zones.find((x) => x.id === id);
        if (!before) return;
        set({ zones: get().zones.map((x) => (x.id === id ? { ...x, ...z } : x)) });
        logAuditAction({
          userId: actor.id, userName: actor.name, userRole: actor.role,
          action: 'update', entityType: 'settings', entityId: id, entityLabel: `Delivery zone: ${before.state}`,
          summary: 'Updated delivery zone',
          changes: { before: z as unknown as Record<string, unknown>, after: { ...z } as unknown as Record<string, unknown> },
        });
      },
      removeZone: (id, actor) => {
        const z = get().zones.find((x) => x.id === id);
        if (!z) return;
        set({ zones: get().zones.filter((x) => x.id !== id) });
        logAuditAction({
          userId: actor.id, userName: actor.name, userRole: actor.role,
          action: 'delete', entityType: 'settings', entityId: id, entityLabel: `Delivery zone: ${z.state}`,
          summary: 'Removed delivery zone',
          changes: { before: z as unknown as Record<string, unknown>, after: null },
        });
      },
    }),
    { name: 'havanat-zones' }
  )
);
