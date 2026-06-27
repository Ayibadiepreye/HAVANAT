// Delivery zone + email template + branding store
import { create } from 'zustand';

import type { DeliveryZone } from '@/types/dashboard';
import { logAuditAction } from '@/utils/auditLogger';
import { apiConfig, apiDelete, apiGet, apiPost } from '@/lib/api';
import { useAuthStore } from '@/stores/useAuthStore';

interface DeliveryZoneState {
  zones: DeliveryZone[];
  fetchZones: () => Promise<void>;
  addZone: (z: Omit<DeliveryZone, 'id'>, actor: { id: string; name: string; role: 'admin' | 'moderator' }) => void;
  updateZone: (id: string, z: Partial<DeliveryZone>, actor: { id: string; name: string; role: 'admin' | 'moderator' }) => void;
  removeZone: (id: string, actor: { id: string; name: string; role: 'admin' | 'moderator' }) => void;
}

export const useDeliveryZoneStore = create<DeliveryZoneState>()(
  (set, get) => ({
      zones: [],
      fetchZones: async () => {
        if (!apiConfig.useBackend || !useAuthStore.getState().isAuthenticated) return;
        try {
          const res = await apiGet<{ items: any[] }>('/api/content/delivery-zones', true);
          set({ zones: res.items.map((z) => ({ id: String(z.id), state: z.state, fee: Number(z.fee), eta: z.eta })) });
        } catch (err) {
          console.error('fetchZones failed', err);
        }
      },
      addZone: async (z, actor) => {
        if (!apiConfig.useBackend || !useAuthStore.getState().isAuthenticated) {
          const id = `zone-${Date.now()}`;
          set({ zones: [...get().zones, { ...z, id }] });
          return;
        }
        try {
          const created = await apiPost<{ id: number }>('/api/content/delivery-zones', z, true);
          // Mirror local + audit
          set({ zones: [...get().zones, { ...z, id: String(created.id) }] });
          logAuditAction({
            userId: actor.id, userName: actor.name, userRole: actor.role,
            action: 'create', entityType: 'settings', entityId: String(created.id), entityLabel: `Delivery zone: ${z.state}`,
            summary: 'Added delivery zone',
            changes: { before: null, after: z },
          });
        } catch (err) {
          console.error('addZone backend POST failed', err);
        }
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
      removeZone: async (id, actor) => {
        const z = get().zones.find((x) => x.id === id);
        if (!z) return;
        if (!apiConfig.useBackend || !useAuthStore.getState().isAuthenticated) {
          set({ zones: get().zones.filter((x) => x.id !== id) });
          return;
        }
        try {
          await apiDelete(`/api/content/delivery-zones/${id}`, true);
          set({ zones: get().zones.filter((x) => x.id !== id) });
          logAuditAction({
            userId: actor.id, userName: actor.name, userRole: actor.role,
            action: 'delete', entityType: 'settings', entityId: id, entityLabel: `Delivery zone: ${z.state}`,
            summary: 'Removed delivery zone',
            changes: { before: z as unknown as Record<string, unknown>, after: null },
          });
        } catch (err) {
          console.error('removeZone backend DELETE failed', err);
        }
      },
    }),
);
