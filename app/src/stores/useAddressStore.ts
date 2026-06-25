// Global address book. One source of truth for all addresses the user has saved.
// Checkout, account management, rider handoff all read from this store.

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { logAuditAction } from '@/utils/auditLogger';
import { apiConfig, apiGet, apiPost, apiDelete } from '@/lib/api';
import { useAuthStore } from '@/stores/useAuthStore';

export interface Address {
  id: string;
  label: 'Home' | 'Office' | 'Other' | string;
  fullName: string;
  phone: string;
  email?: string;
  street: string;
  city: string;
  state: string;
  isDefault: boolean;
}

interface AddressState {
  addresses: Address[];
  addAddress: (input: Omit<Address, 'id'>, actor: { id: string; name: string; role: 'admin' | 'moderator' | 'system' }) => Promise<Address>;
  updateAddress: (id: string, patch: Partial<Address>, actor: { id: string; name: string; role: 'admin' | 'moderator' | 'system' }) => void;
  removeAddress: (id: string, actor: { id: string; name: string; role: 'admin' | 'moderator' | 'system' }) => void;
  setDefault: (id: string) => void;
  getDefault: () => Address | undefined;
  clearAll: () => void;
}

const SEED: Address[] = [
  {
    id: 'a-default',
    label: 'Home',
    fullName: 'Demo Customer',
    phone: '+234 803 000 0001',
    street: '12B Demo Street, GRA Phase 2',
    city: 'Port Harcourt',
    state: 'Rivers',
    isDefault: true,
  },
];

function newId() {
  return `a-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
}

export const useAddressStore = create<AddressState>()(
  persist(
    (set, get) => ({
      addresses: SEED,
      addAddress: async (input, actor) => {
        if (apiConfig.useBackend && useAuthStore.getState().isAuthenticated) {
          try {
            const created = await apiPost<any>('/api/addresses', input, true);
            const addr: Address = { ...input, id: String(created.id) };
            const isFirst = get().addresses.length === 0;
            const next = isFirst || input.isDefault
              ? [addr, ...get().addresses.map((a) => ({ ...a, isDefault: false }))]
              : [...get().addresses, addr];
            set({ addresses: next });
            return addr;
          } catch (err) {
            console.error('addAddress backend failed', err);
            // Fall through to local
          }
        }
        const addr: Address = { id: newId(), ...input };
        const isFirst = get().addresses.length === 0;
        // If marked default, clear other defaults
        const next = isFirst || input.isDefault
          ? [addr, ...get().addresses.map((a) => ({ ...a, isDefault: false }))]
          : [...get().addresses, addr];
        set({ addresses: next });
        logAuditAction({
          userId: actor.id, userName: actor.name,
          userRole: actor.role === 'system' ? 'admin' : actor.role,
          action: 'create', entityType: 'settings',
          entityId: addr.id, entityLabel: `Address: ${addr.label}`,
          summary: 'Added address',
          changes: { before: null, after: { ...addr } as unknown as Record<string, unknown> },
        });
        return addr;
      },
      updateAddress: (id, patch, actor) => {
        const before = get().addresses.find((a) => a.id === id);
        if (!before) return;
        const merged = { ...before, ...patch };
        const cleared = patch.isDefault
          ? get().addresses.map((a) => (a.id === id ? merged : { ...a, isDefault: false }))
          : get().addresses.map((a) => (a.id === id ? merged : a));
        set({ addresses: cleared });
        logAuditAction({
          userId: actor.id, userName: actor.name,
          userRole: actor.role === 'system' ? 'admin' : actor.role,
          action: 'update', entityType: 'settings',
          entityId: id, entityLabel: `Address: ${merged.label}`,
          summary: 'Updated address',
          changes: { before: { ...before } as unknown as Record<string, unknown>, after: { ...merged } as unknown as Record<string, unknown> },
        });
      },
      removeAddress: async (id, actor) => {
        if (apiConfig.useBackend && useAuthStore.getState().isAuthenticated) {
          try { await apiDelete(`/api/addresses/${id}`, true); } catch (err) { console.error(err); }
        }
        const before = get().addresses.find((a) => a.id === id);
        if (!before) return;
        const remaining = get().addresses.filter((a) => a.id !== id);
        // If we removed the default and others remain, promote the first one
        if (before.isDefault && remaining.length > 0 && !remaining.some((a) => a.isDefault)) {
          remaining[0] = { ...remaining[0], isDefault: true };
        }
        set({ addresses: remaining });
        logAuditAction({
          userId: actor.id, userName: actor.name,
          userRole: actor.role === 'system' ? 'admin' : actor.role,
          action: 'delete', entityType: 'settings',
          entityId: id, entityLabel: `Address: ${before.label}`,
          summary: 'Removed address',
          changes: { before: { ...before } as unknown as Record<string, unknown>, after: null },
        });
      },
      setDefault: (id) => {
        set({
          addresses: get().addresses.map((a) => ({ ...a, isDefault: a.id === id })),
        });
      },
      getDefault: () => get().addresses.find((a) => a.isDefault) ?? get().addresses[0],
      clearAll: () => set({ addresses: [] }),
      fetchAddresses: async () => {
        if (!apiConfig.useBackend || !useAuthStore.getState().isAuthenticated) return;
        try {
          const res = await apiGet<{ items: any[] }>('/api/addresses', true);
          const mapped: Address[] = (res.items || []).map((a) => ({
            id: String(a.id),
            label: a.label,
            fullName: a.fullName,
            phone: a.phone,
            street: a.street,
            city: a.city,
            state: a.state,
            isDefault: a.isDefault,
          }));
          set({ addresses: mapped });
        } catch (err) {
          console.error('fetchAddresses failed', err);
        }
      },
    }),
    { name: 'havanat-addresses' }
  )
);