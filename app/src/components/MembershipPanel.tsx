import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiPost } from '@/lib/api';
import { Crown, Calendar, Check, AlertCircle } from 'lucide-react';
import { useMembershipSubscriptionStore, TIER_PRICING } from '@/stores/useMembershipSubscriptionStore';
import { useMembershipStatus } from '@/hooks/useMembershipStatus';
import { useAuthStore } from '@/stores/useAuthStore';
import { useTierStore } from '@/stores/useTierStore';
import { useUIStore } from '@/stores/useUIStore';

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

  // Authoritative membership state from the DB — never trust local mirror.
  // After Paystack confirms, the parent re-mounts and this hook re-fetches.
  const status = useMembershipStatus();
  const renew = useMembershipSubscriptionStore((s) => s.renew);
  const effectiveTier = status.effectiveTier;
  const daysRemaining = status.daysRemaining;
  const state = status.status;
  const scheduledTo = status.scheduledTo;
  const currentPeriodEnd = status.currentPeriodEnd;
  const cancelAtPeriodEnd = status.cancelAtPeriodEnd;


  const navigate = useNavigate();
  // Real Paystack subscribe: hits /api/memberships/subscribe -> redirects to
  // Paystack checkout -> user pays -> redirected back to /account?tab=membership&paystack=verify
  // -> /api/memberships/confirm flips the DB tier.
  const [subscribing, setSubscribing] = useState<null | 'Deluxe' | 'Elite'>(null);
  async function startPaystackSubscribe(tierName: 'Deluxe' | 'Elite') {
    if (!user) {
      showToast('Sign in to subscribe', 'info');
      navigate(`/login?redirect=/account?tab=membership`);
      return;
    }
    if (user.emailVerified === false) {
      showToast('Please verify your email before subscribing', 'info');
      navigate(`/account?tab=membership&needsVerify=1`);
      return;
    }
    setSubscribing(tierName);
    try {
      const res = await apiPost<{
        authorizationUrl: string;
        reference: string;
        amount: number;
        tier: string;
        billingCycle: string;
      }>('/api/memberships/subscribe', {
        tier: tierName,
        billingCycle: 'monthly',
      }, true);
      // Hand off to Paystack — the callback is /account?tab=membership&paystack=verify
      window.location.href = res.authorizationUrl;
    } catch (err: any) {
      console.error('subscribe failed', err);
      const msg = err?.message || '';
      if (msg.includes('Paystack not configured')) {
        showToast('Payments temporarily unavailable. Please try again shortly.', 'error');
      } else if (msg.includes('already on this tier')) {
        showToast(`You're already on ${tierName}.`, 'info');
      } else {
        showToast(msg || 'Could not start checkout. Please try again.', 'error');
      }
      setSubscribing(null);
    }
  }

  async function handleScheduleDowngrade(to: 'standard' | 'Standard' | 'Deluxe' | 'Elite') {
    // Schedule downgrade — backend is the source of truth (memberships.scheduledDowngradeTo).
    // /api/memberships/tick uses this to auto-revert at period end.
    try {
      const apiTier = to.charAt(0).toUpperCase() + to.slice(1);
      await apiPost('/api/memberships/schedule-downgrade', { to: apiTier }, true);
      await status.refresh();
      showToast(`Downgrade to ${to} scheduled. Takes effect at end of current period.`, 'info');
    } catch (err: any) {
      showToast(err?.message || 'Could not schedule downgrade.', 'error');
    }
  }

  async function handleUpgrade(tier: 'standard' | 'deluxe' | 'elite') {
    if (tier === 'standard') return; // covered by handleScheduleDowngrade
    // Upgrades require immediate payment — go through Paystack just like new subs.
    const tierName = tier === 'deluxe' ? 'Deluxe' : 'Elite';
    await startPaystackSubscribe(tierName);
  }

  async function handleCancelDowngrade() {
    try {
      await apiPost('/api/memberships/schedule-downgrade/cancel', {}, true);
      await status.refresh();
      showToast('Scheduled downgrade cancelled', 'success');
    } catch (err: any) {
      showToast(err?.message || 'Could not cancel scheduled downgrade.', 'error');
    }
  }

  async function handleCancelSubscription() {
    try {
      await apiPost('/api/memberships/cancel', {}, true);
      await status.refresh();
      showToast('Auto-renew turned off. You keep access until the period ends.', 'info');
    } catch (err: any) {
      showToast(err?.message || 'Could not cancel subscription.', 'error');
    }
  }

  async function handleRenew(tier: 'deluxe' | 'elite') {
    // After a subscription ends the user must re-subscribe — that means a new
    // Paystack charge. The renew() store action redirects to checkout.
    try {
      await renew(tier, { id: user?.id ?? 'guest', name: user?.name ?? 'Customer', role: 'system' });
    } catch (err: any) {
      showToast(err?.message || 'Could not start checkout.', 'error');
    }
  }

  const paidTier = status.isPaid ? effectiveTier : null;
  const inGrace = state === 'grace';
  const expiring = state === 'expiring' || state === 'grace';
  const ended = state === 'ended';

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
            {paidTier && currentPeriodEnd && (
              <p className="text-xs text-gray-500 mt-1">
                <Calendar size={11} className="inline mr-1" />
                {cancelAtPeriodEnd
                  ? `Access until ${currentPeriodEnd.slice(0, 10)} · ${daysLabel(daysRemaining)}`
                  : `Renews on ${currentPeriodEnd.slice(0, 10)} · ${daysLabel(daysRemaining)}`}
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
          {paidTier && !cancelAtPeriodEnd && (
            <button
              onClick={handleCancelSubscription}
              className="text-[10px] uppercase tracking-[0.15em] text-gray-500 hover:text-red-600 underline"
            >
              Turn off auto-renew
            </button>
          )}
          {paidTier && cancelAtPeriodEnd && (
            <button
              onClick={() => effectiveTier !== 'standard' && handleRenew(effectiveTier)}
              className="text-[10px] uppercase tracking-[0.15em] text-black underline"
            >
              Resubscribe now
            </button>
          )}
        </div>

        {scheduledTo && currentPeriodEnd && (
          <div className="bg-amber-50 border border-amber-200 p-3 text-sm mb-4">
            <p className="text-amber-800">
              You have a scheduled downgrade to <strong className="capitalize">{scheduledTo}</strong> on {currentPeriodEnd.slice(0, 10)}.
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
                          // Rule: any switch involving a paid tier — except the
                          // sole 'downgrade to free (Standard)' case — requires
                          // an immediate Paystack charge. The only deferred case
                          // is 'paid -> Standard' which schedules a free revert
                          // at end of period (no refund, no charge).
                          if (tier === paidTier) {
                            showToast(`You're already on ${tier}.`, 'info');
                          } else {
                            handleUpgrade(tier);
                          }
                        }}
                        disabled={subscribing !== null}
                        className="w-full py-2 bg-black text-white text-[10px] uppercase tracking-[0.15em] font-medium disabled:opacity-50"
                      >
                        {subscribing
                          ? 'Redirecting…'
                          : tier === paidTier
                            ? 'Current plan'
                            : `Pay & switch to ${TIER_PRICING[tier].label}`}
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