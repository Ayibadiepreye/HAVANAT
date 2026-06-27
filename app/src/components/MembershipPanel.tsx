import { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Crown, Calendar, Check, AlertCircle } from 'lucide-react';
import {
  useMembershipSubscriptionStore,
  tickMembershipLifecycle,
  TIER_PRICING,
  type MembershipTier,
} from '@/stores/useMembershipSubscriptionStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { useTierStore } from '@/stores/useTierStore';
import { useUIStore } from '@/stores/useUIStore';
import { useNotificationStore } from '@/stores/useNotificationStore';

function daysLabel(n: number): string {
  if (n <= 0) return 'expired';
  if (n === 1) return '1 day left';
  return `${n} days left`;
}

export default function MembershipPanel() {

  // Live tier data from /api/memberships/tiers — replaces hardcoded TIER_PRICING.
  const liveTiers = useTierStore((s) => s.tiers);
  const tierPriceFor = (tier: 'standard' | 'deluxe' | 'elite') => {
    const live = liveTiers.find((t) => t.tier.toLowerCase() === tier);
    if (live) return { monthly: live.price, label: live.displayName };
    // Fallback: TIER_PRICING only has 'deluxe' and 'elite'; 'standard' is free.
    if (tier === 'standard') return { monthly: 0, label: 'Standard' };
    const fallback = TIER_PRICING[tier];
    return { monthly: fallback.monthly, label: fallback.label };
  };
 const user = useAuthStore((s) => s.user);
  const showToast = useUIStore((s) => s.showToast);
  const broadcast = useNotificationStore((s) => s.broadcast);

  const current = useMembershipSubscriptionStore((s) => s.current);
  const subscribe = useMembershipSubscriptionStore((s) => s.subscribe);
  const scheduleDowngrade = useMembershipSubscriptionStore((s) => s.scheduleDowngrade);
  const cancelScheduledDowngrade = useMembershipSubscriptionStore((s) => s.cancelScheduledDowngrade);
  const cancelSubscription = useMembershipSubscriptionStore((s) => s.cancelSubscription);
  const daysRemaining = useMembershipSubscriptionStore((s) => s.daysRemaining());
  const state = useMembershipSubscriptionStore((s) => s.state());
  const effectiveTier = useMembershipSubscriptionStore((s) => s.effectiveTier());

  const actor = useMemo(() => ({
    id: user?.id ?? 'guest',
    name: user?.name ?? 'Customer',
    role: 'system' as const,
  }), [user?.id, user?.name]);

  // Tick the lifecycle on mount — sends reminders if needed
  useEffect(() => {
    tickMembershipLifecycle(({ tier, daysLeft, ended }) => {
      if (ended) {
        showToast(`Your ${tier} subscription ended. You've been moved to Standard.`, 'info');
        broadcast(
          {
            title: `Your ${TIER_PRICING[tier].label} subscription has ended`,
            body: `Your paid membership expired and you&apos;ve been moved to Standard. You can resubscribe anytime from your account.`,
            category: 'membership',
            channels: 'both',
            scope: 'user',
            targetUserId: user?.id,
          },
          actor
        );
      } else {
        showToast(`Your ${tier} subscription expires in ${daysLeft} day${daysLeft === 1 ? '' : 's'}.`, 'info');
        broadcast(
          {
            title: `${TIER_PRICING[tier].label} expires in ${daysLabel(daysLeft)}`,
            body: `Renew now to keep your perks. Your subscription will auto-revert to Standard at the end of the current period if you don&apos;t resubscribe.`,
            category: 'membership',
            channels: 'both',
            scope: 'user',
            targetUserId: user?.id,
          },
          actor
        );
      }
    });
  }, [actor, broadcast, showToast, user?.id]);

  function handleSubscribe(tier: Exclude<MembershipTier, 'standard'>) {
    subscribe(tier, actor);
    broadcast(
      {
        title: `Welcome to ${TIER_PRICING[tier].label}`,
        body: `Your ${TIER_PRICING[tier].label} subscription is active. Next renewal: ${(current?.endsAt || new Date().toISOString()).slice(0, 10)}.`,
        category: 'membership',
        channels: 'both',
        scope: 'user',
        targetUserId: user?.id,
      },
      actor
    );
    showToast(`Subscribed to ${TIER_PRICING[tier].label}`, 'success');
  }

  function handleScheduleDowngrade(to: MembershipTier) {
    scheduleDowngrade(to, actor);
    showToast(`Downgrade to ${to} scheduled. Takes effect at end of current period.`, 'info');
  }

  function handleCancelDowngrade() {
    cancelScheduledDowngrade(actor);
    showToast('Scheduled downgrade cancelled', 'success');
  }

  function handleCancelSubscription() {
    cancelSubscription(actor);
    showToast('Auto-renew turned off. You keep access until the period ends.', 'info');
  }

  function handleRenew(tier: Exclude<MembershipTier, 'standard'>) {
    subscribe(tier, actor);
    showToast(`Re-subscribed to ${TIER_PRICING[tier].label}`, 'success');
  }

  const paidTier = current && effectiveTier !== 'standard' ? effectiveTier : null;
  const inGrace = state === 'grace';
  const expiring = state === 'expiring' || state === 'grace';
  const ended = state === 'ended';
  const scheduledTo = current?.scheduledDowngradeTo ?? null;

  return (
    <div className="space-y-6">
      {/* Current status */}
      <div className="border border-gray-200 p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3 flex-wrap mb-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] text-gray-400 mb-1">Current plan</p>
            <div className="flex items-center gap-2">
              <Crown size={18} className={paidTier ? 'text-black' : 'text-gray-400'} />
              <span className="font-serif text-2xl capitalize">{effectiveTier}</span>
            </div>
            {paidTier && current && (
              <p className="text-xs text-gray-500 mt-1">
                <Calendar size={11} className="inline mr-1" />
                Renews on {current.endsAt.slice(0, 10)} · {daysLabel(daysRemaining)}
              </p>
            )}
            {ended && (
              <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                <AlertCircle size={11} /> Your subscription has ended. You&apos;re on Standard.
              </p>
            )}
            {inGrace && !ended && (
              <p className="text-xs text-amber-700 mt-1 flex items-center gap-1">
                <AlertCircle size={11} /> Last day of your current period — resubscribe to keep your perks.
              </p>
            )}
            {expiring && !inGrace && !ended && (
              <p className="text-xs text-amber-700 mt-1">Your subscription is nearing its renewal date.</p>
            )}
          </div>
          {paidTier && (
            <button
              onClick={handleCancelSubscription}
              className="text-[10px] uppercase tracking-[0.15em] text-gray-500 hover:text-red-600 underline"
            >
              Turn off auto-renew
            </button>
          )}
        </div>

        {scheduledTo && (
          <div className="bg-amber-50 border border-amber-200 p-3 text-sm mb-4">
            <p className="text-amber-800">
              You have a scheduled downgrade to <strong className="capitalize">{scheduledTo}</strong> on {current?.endsAt.slice(0, 10)}.
            </p>
            <button onClick={handleCancelDowngrade} className="mt-2 text-[10px] uppercase tracking-[0.15em] text-amber-800 underline hover:text-black">
              Keep my {paidTier ?? effectiveTier} plan instead
            </button>
          </div>
        )}

        {paidTier && (
          <div className="text-sm space-y-1.5 text-gray-600">
            <p className="flex items-center gap-1.5"><Check size={12} className="text-green-600" /> Per-item member discount on every product</p>
            <p className="flex items-center gap-1.5"><Check size={12} className="text-green-600" /> Priority support & early access to new collections</p>
            {paidTier === 'elite' && (
              <p className="flex items-center gap-1.5"><Check size={12} className="text-green-600" /> Bespoke fittings + dedicated concierge</p>
            )}
          </div>
        )}
      </div>

      {/* Upgrade / change plan */}
      <div>
        <h3 className="text-xs tracking-[0.15em] font-semibold uppercase mb-3">
          {paidTier ? 'Change your plan' : 'Choose a plan'}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {(['standard', 'deluxe', 'elite'] as const).map((tier) => {
            const isCurrent = effectiveTier === tier;
            const isScheduled = scheduledTo === tier;
            const isPaid = tier !== 'standard';
            return (
              <div
                key={tier}
                className={`p-4 border transition-colors ${
                  isCurrent ? 'border-black bg-gray-50' : 'border-gray-200'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Crown size={14} className={isCurrent ? 'text-black' : 'text-gray-400'} />
                  <span className="text-xs uppercase tracking-[0.15em] font-semibold">{tier}</span>
                  {isCurrent && <span className="text-[9px] uppercase tracking-[0.15em] text-gray-500 ml-auto">Active</span>}
                  {isScheduled && <span className="text-[9px] uppercase tracking-[0.15em] text-amber-700 ml-auto">Scheduled</span>}
                </div>
                {isPaid ? (
                  <p className="text-sm font-medium mb-2">
                    ₦{tierPriceFor(tier).monthly.toLocaleString()}/mo
                  </p>
                ) : (
                  <p className="text-sm font-medium mb-2">Free</p>
                )}
                <p className="text-xs text-gray-500 mb-3">
                  {tier === 'standard' && 'Base pricing. No subscription needed.'}
                  {tier === 'deluxe' && 'Per-item discount (default 5%, admin-overridable).'}
                  {tier === 'elite' && 'Per-item discount (default 10%) + bespoke fittings + early access.'}
                </p>
                {!isCurrent && (
                  <>
                    {tier === 'standard' && paidTier && (
                      <button
                        onClick={() => handleScheduleDowngrade('standard')}
                        className="w-full py-2 border text-[10px] uppercase tracking-[0.15em] hover:border-black"
                      >
                        Schedule downgrade
                      </button>
                    )}
                    {isPaid && !isScheduled && (
                      <button
                        onClick={() => {
                          if (paidTier) handleScheduleDowngrade(tier);
                          else handleSubscribe(tier);
                        }}
                        className="w-full py-2 bg-black text-white text-[10px] uppercase tracking-[0.15em] font-medium"
                      >
                        {paidTier ? 'Schedule upgrade' : 'Subscribe'}
                      </button>
                    )}
                    {isPaid && isScheduled && (
                      <button
                        onClick={handleCancelDowngrade}
                        className="w-full py-2 border text-[10px] uppercase tracking-[0.15em]"
                      >
                        Cancel scheduled
                      </button>
                    )}
                    {isPaid && ended && (
                      <button
                        onClick={() => handleRenew(tier)}
                        className="w-full py-2 bg-black text-white text-[10px] uppercase tracking-[0.15em] font-medium"
                      >
                        Re-subscribe
                      </button>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
        <p className="text-[10px] text-gray-400 mt-3">
          Subscription prices come from your account&apos;s membership tier settings and are managed by your admin. Downgrades take effect at the end of the current period. Auto-revert to Standard if you don&apos;t renew.
        </p>
      </div>

      {!paidTier && (
        <div className="bg-gray-50 border border-gray-200 p-4 text-sm text-gray-600 text-center">
          See all the perks on the <Link to="/membership" className="underline">membership overview</Link>.
        </div>
      )}
    </div>
  );
}