// Membership subscription store. Membership is subscription-based:
//   - Standard:  free, never expires, no reminders
//   - Deluxe / Elite: monthly subscription, ₦10,000 / ₦25,000
//
// Lifecycle:
//   - active     — paid and within current billing period
//   - expiring   — within last 5 days of current period (reminders fire)
//   - grace      — last 2 days
//   - ended      — past expiry, auto-reverted to Standard
//
// Downgrade = scheduled change effective at end of current period.
// The user can cancel anytime. Cancellations take effect at end of period.
// Reminders are sent 5, 2, and 1 day before expiry.

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { logAuditAction } from '@/utils/auditLogger';

export type MembershipTier = 'standard' | 'deluxe' | 'elite';
export type SubscriptionState = 'none' | 'active' | 'expiring' | 'grace' | 'ended';

export interface SubscriptionPeriod {
  tier: MembershipTier;
  /** ISO timestamp of when this period started. */
  startedAt: string;
  /** ISO timestamp of when this period ends. */
  endsAt: string;
  /** The tier the user has *scheduled* to switch to at the end of the current period. `null` = auto-renew. */
  scheduledDowngradeTo?: MembershipTier | null;
  /** Whether the user has cancelled (auto-renew off). True = access ends at endsAt. */
  cancelled: boolean;
}

export const TIER_PRICING: Record<Exclude<MembershipTier, 'standard'>, { monthly: number; label: string }> = {
  deluxe: { monthly: 10000, label: 'Deluxe' },
  elite:  { monthly: 25000, label: 'Elite' },
};

const PERIOD_DAYS = 30;

function periodEnd(start: Date = new Date()): Date {
  const end = new Date(start);
  end.setDate(end.getDate() + PERIOD_DAYS);
  return end;
}

function daysBetween(a: Date, b: Date): number {
  return Math.ceil((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

interface MembershipState {
  /** Active or most-recent subscription. `null` for Standard. */
  current: SubscriptionPeriod | null;
  /** Subscribe to a paid tier. Standard has no subscription. */
  subscribe: (tier: Exclude<MembershipTier, 'standard'>, actor: { id: string; name: string; role: 'admin' | 'moderator' | 'system' }) => void;
  /** Schedule a downgrade to take effect at end of current period. */
  scheduleDowngrade: (to: MembershipTier, actor: { id: string; name: string; role: 'admin' | 'moderator' | 'system' }) => void;
  /** Cancel scheduled downgrade. */
  cancelScheduledDowngrade: (actor: { id: string; name: string; role: 'admin' | 'moderator' | 'system' }) => void;
  /** Cancel current subscription (auto-renew off, ends at period end). */
  cancelSubscription: (actor: { id: string; name: string; role: 'admin' | 'moderator' | 'system' }) => void;
  /** Re-subscribe (after ended) to start a new period. */
  renew: (tier: Exclude<MembershipTier, 'standard'>, actor: { id: string; name: string; role: 'admin' | 'moderator' | 'system' }) => void;
  /** Computed: how many days are left in the current period. */
  daysRemaining: () => number;
  /** Computed: lifecycle state for current period. */
  state: () => SubscriptionState;
  /** The tier the user *effectively* has right now (handles ended → standard). */
  effectiveTier: () => MembershipTier;
  /** Has the 5/2/1 day reminder been sent for this period? Used so we don't double-send. */
  reminderSent5Day: boolean;
  reminderSent2Day: boolean;
  reminderSent1Day: boolean;
  setReminderSent: (which: '5' | '2' | '1') => void;
}

export const useMembershipSubscriptionStore = create<MembershipState>()(
  persist(
    (set, get) => ({
      current: null,
      reminderSent5Day: false,
      reminderSent2Day: false,
      reminderSent1Day: false,

      subscribe: (tier, actor) => {
        const start = new Date();
        const end = periodEnd(start);
        const period: SubscriptionPeriod = { tier, startedAt: start.toISOString(), endsAt: end.toISOString(), cancelled: false, scheduledDowngradeTo: null };
        set({ current: period, reminderSent5Day: false, reminderSent2Day: false, reminderSent1Day: false });
        logAuditAction({
          userId: actor.id, userName: actor.name,
          userRole: actor.role === 'system' ? 'admin' : actor.role,
          action: 'create', entityType: 'settings',
          entityId: 'self', entityLabel: `Membership subscription: ${tier}`,
          summary: `Subscribed to ${tier} until ${end.toISOString().slice(0, 10)}`,
          changes: { before: null, after: { tier } as unknown as Record<string, unknown> },
        });
      },

      scheduleDowngrade: (to, actor) => {
        const cur = get().current;
        if (!cur) return;
        set({ current: { ...cur, scheduledDowngradeTo: to } });
        logAuditAction({
          userId: actor.id, userName: actor.name,
          userRole: actor.role === 'system' ? 'admin' : actor.role,
          action: 'update', entityType: 'settings',
          entityId: 'self', entityLabel: `Scheduled downgrade → ${to}`,
          summary: `Downgrade to ${to} scheduled for end of period`,
          changes: { before: { scheduledDowngradeTo: cur.scheduledDowngradeTo ?? null } as unknown as Record<string, unknown>, after: { scheduledDowngradeTo: to } as unknown as Record<string, unknown> },
        });
      },

      cancelScheduledDowngrade: (actor) => {
        const cur = get().current;
        if (!cur) return;
        set({ current: { ...cur, scheduledDowngradeTo: null } });
        logAuditAction({
          userId: actor.id, userName: actor.name,
          userRole: actor.role === 'system' ? 'admin' : actor.role,
          action: 'update', entityType: 'settings',
          entityId: 'self', entityLabel: `Cancelled scheduled downgrade`,
          summary: 'Reverted scheduled downgrade',
          changes: { before: { scheduledDowngradeTo: cur.scheduledDowngradeTo ?? null } as unknown as Record<string, unknown>, after: { scheduledDowngradeTo: null } as unknown as Record<string, unknown> },
        });
      },

      cancelSubscription: (actor) => {
        const cur = get().current;
        if (!cur) return;
        set({ current: { ...cur, cancelled: true } });
        logAuditAction({
          userId: actor.id, userName: actor.name,
          userRole: actor.role === 'system' ? 'admin' : actor.role,
          action: 'update', entityType: 'settings',
          entityId: 'self', entityLabel: 'Cancelled subscription',
          summary: 'Auto-renew turned off; access ends at period end',
          changes: { before: { cancelled: cur.cancelled } as unknown as Record<string, unknown>, after: { cancelled: true } as unknown as Record<string, unknown> },
        });
      },

      renew: (tier, actor) => {
        // Same as subscribe but allows re-subscribing after ended
        get().subscribe(tier, actor);
      },

      daysRemaining: () => {
        const cur = get().current;
        if (!cur) return 0;
        return Math.max(0, daysBetween(new Date(), new Date(cur.endsAt)));
      },

      state: () => {
        const cur = get().current;
        if (!cur) return 'none';
        const days = get().daysRemaining();
        if (days <= 0) return 'ended';
        if (days <= 1) return 'grace';
        if (days <= 5) return 'expiring';
        return 'active';
      },

      effectiveTier: () => {
        const cur = get().current;
        if (!cur) return 'standard';
        if (get().daysRemaining() <= 0) return 'standard';
        return cur.tier;
      },

      setReminderSent: (which) => {
        if (which === '5') set({ reminderSent5Day: true });
        if (which === '2') set({ reminderSent2Day: true });
        if (which === '1') set({ reminderSent1Day: true });
      },
    }),
    { name: 'havanat-membership' }
  )
);

/**
 * Period tick: should be called once a day (or on app load). Checks
 * subscription state and dispatches reminders + auto-revert if needed.
 *
 * Mock: we call this on app load and from the account page.
 * Backend cutover: backend cron job runs this server-side and sends email.
 */
export function tickMembershipLifecycle(notify: (opts: { tier: 'deluxe' | 'elite'; daysLeft: number; ended: boolean }) => void) {
  const s = useMembershipSubscriptionStore.getState();
  if (!s.current) return;
  const days = s.daysRemaining();
  const state = s.state();
  if (state === 'ended' || days <= 0) {
    // Auto-revert: clear current + reset reminder flags
    if (s.current && (s.current.scheduledDowngradeTo || s.current.cancelled)) {
      useMembershipSubscriptionStore.setState({ current: null, reminderSent5Day: false, reminderSent2Day: false, reminderSent1Day: false });
      notify({ tier: s.current.tier === 'standard' ? 'deluxe' : s.current.tier, daysLeft: 0, ended: true });
    } else {
      // Auto-renew to same tier — start a new period
      const start = new Date();
      const end = new Date(start); end.setDate(end.getDate() + 30);
      useMembershipSubscriptionStore.setState({
        current: { tier: s.current.tier, startedAt: start.toISOString(), endsAt: end.toISOString(), cancelled: false, scheduledDowngradeTo: null },
        reminderSent5Day: false, reminderSent2Day: false, reminderSent1Day: false,
      });
    }
    return;
  }
  if (days === 5 && !s.reminderSent5Day) {
    notify({ tier: s.current.tier === 'standard' ? 'deluxe' : s.current.tier, daysLeft: 5, ended: false });
    s.setReminderSent('5');
  } else if (days === 2 && !s.reminderSent2Day) {
    notify({ tier: s.current.tier === 'standard' ? 'deluxe' : s.current.tier, daysLeft: 2, ended: false });
    s.setReminderSent('2');
  } else if (days === 1 && !s.reminderSent1Day) {
    notify({ tier: s.current.tier === 'standard' ? 'deluxe' : s.current.tier, daysLeft: 1, ended: false });
    s.setReminderSent('1');
  }
}