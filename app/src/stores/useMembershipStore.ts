// Memberships store - admin edits tier pricing/features, audit logged
import { create } from 'zustand';
import type { Member } from '@/types/dashboard';
import type { MembershipTier } from '@/types';
import { MEMBERSHIP_TIERS as SEED_TIERS } from '@/config/membership';
import { logAuditAction } from '@/utils/auditLogger';
import { apiConfig, apiGet, apiPut } from '@/lib/api';
import { useAuthStore } from '@/stores/useAuthStore';

interface MembershipState {
  tiers: MembershipTier[];
  fetchTiers: () => Promise<void>;
  fetchMembers: () => Promise<void>;
  members: Member[];
  saveTier: (tier: 'Standard' | 'Deluxe' | 'Elite', next: MembershipTier, actor: { id: string; name: string; role: 'admin' | 'moderator' }) => void;
  setMemberStatus: (memberId: string, status: Member['status'], actor: { id: string; name: string; role: 'admin' | 'moderator' }) => void;
  changeMemberTier: (memberId: string, tier: Member['tier'], actor: { id: string; name: string; role: 'admin' | 'moderator' }) => void;
}

export const useMembershipStore = create<MembershipState>()(
  (set, get) => ({
      tiers: SEED_TIERS,
      members: [],
      fetchMembers: async () => {
        if (!apiConfig.useBackend || !useAuthStore.getState().isAuthenticated) return;
        try {
          const res = await apiGet<{ items: any[] }>('/api/admin/members', true);
          set({ members: (res.items || []).map((m) => ({
            id: String(m.id),
            name: m.name,
            email: m.email,
            phone: m.phone ?? '',
            tier: m.tier,
            status: m.status ?? 'active',
            billingCycle: m.billingCycle ?? 'monthly',
            startDate: m.joinedAt ?? new Date().toISOString(),
            nextBillingDate: m.nextBillingDate ?? new Date().toISOString(),
            totalSpent: Number(m.totalSpent) || 0,
            joinedAt: m.joinedAt ?? new Date().toISOString(),
            cancelAtPeriodEnd: !!m.cancelAtPeriodEnd,
            scheduledDowngradeTo: m.scheduledDowngradeTo ?? null,
          })) });
        } catch (err) {
          console.error('fetchMembers failed', err);
        }
      },
      fetchTiers: async () => {
        if (!apiConfig.useBackend || !useAuthStore.getState().isAuthenticated) return;
        try {
          const res = await apiGet<{ items: any[] }>('/api/content/memberships', true);
          if (Array.isArray(res.items)) {
            set({ tiers: res.items as any });
          }
        } catch (err) {
          console.error('fetchTiers failed', err);
        }
      },
      saveTier: async (tierName, next, actor) => {
        const before = get().tiers.find((t) => t.tier === tierName);
        if (!before) return;
        // Optimistic local update so the UI reflects immediately.
        set({ tiers: get().tiers.map((t) => (t.tier === tierName ? next : t)) });
        logAuditAction({
          userId: actor.id, userName: actor.name, userRole: actor.role,
          action: 'update', entityType: 'membership_tier', entityId: `tier-${tierName.toLowerCase()}`,
          entityLabel: `Membership tier: ${tierName}`,
          summary: `Updated ${tierName} tier configuration`,
          changes: { before: { ...before }, after: { ...next } },
        });
        // Persist to backend so every page picks up the new price.
        if (apiConfig.useBackend && useAuthStore.getState().isAuthenticated) {
          try {
            await apiPut(`/api/content/memberships/${encodeURIComponent(tierName)}`, {
              displayName: next.tier,
              description: next.description,
              price: Number(next.price) || 0,
              billingCycles: ['monthly'],
              features: next.features.map((f) => {
                // Strip leading check/dot if present so we store the canonical shape.
                const stripped = f.replace(/^[✓·]\s*/, '');
                return { label: stripped, included: f.trimStart().startsWith('✓') };
              }),
            }, true);
            // Force-refresh the public cache so every consumer sees the new price.
            try {
              const { useTierStore } = await import('@/stores/useTierStore');
              await useTierStore.getState().fetch(true);
            } catch {}
          } catch (err) {
            console.error('saveTier failed:', err);
          }
        }
      },
      setMemberStatus: (memberId, status, actor) => {
        const before = get().members.find((m) => m.id === memberId);
        if (!before) return;
        set({ members: get().members.map((m) => (m.id === memberId ? { ...m, status } : m)) });
        logAuditAction({
          userId: actor.id, userName: actor.name, userRole: actor.role,
          action: 'update', entityType: 'member', entityId: memberId, entityLabel: `Member: ${before.name}`,
          summary: `Set membership status to ${status}`,
          changes: { before: { status: before.status }, after: { status } },
        });
      },
      changeMemberTier: (memberId, tier, actor) => {
        const before = get().members.find((m) => m.id === memberId);
        if (!before) return;
        set({ members: get().members.map((m) => (m.id === memberId ? { ...m, tier } : m)) });
        logAuditAction({
          userId: actor.id, userName: actor.name, userRole: actor.role,
          action: 'update', entityType: 'member', entityId: memberId, entityLabel: `Member: ${before.name}`,
          summary: `Changed tier to ${tier}`,
          changes: { before: { tier: before.tier }, after: { tier } },
        });
      },
    }),
);
