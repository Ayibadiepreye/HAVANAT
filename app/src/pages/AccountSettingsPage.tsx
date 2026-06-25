import { useState } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useUIStore } from '@/stores/useUIStore';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { Lock, Mail, Shield, Crown, KeyRound, AlertCircle } from 'lucide-react';
import { canAttempt, recordAttempt, resetAttempts } from '@/utils/rateLimiter';

import { checkPasswordBreached, getPasswordStrength } from '@/utils/breachCheck';

type Section = 'password' | 'email' | 'oauth-password' | 'membership';

export default function AccountSettingsPage() {
  const user = useAuthStore((s) => s.user);
  const dashboardUser = useAuthStore((s) => s.dashboardUser);
  const showToast = useUIStore((s) => s.showToast);
  const broadcast = useNotificationStore((s) => s.broadcast);
  const [section, setSection] = useState<Section>('password');

  // --- Change password ---
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwBusy, setPwBusy] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);
  const [breachWarning, setBreachWarning] = useState<{ breached: boolean; count: number } | null>(null);
  const [breachOverride, setBreachOverride] = useState(false);
  const newPwStrength = newPw ? getPasswordStrength(newPw) : null;

  // --- Change email (OTP) ---
  const [newEmail, setNewEmail] = useState('');
  const [emailOtp, setEmailOtp] = useState('');
  const [emailStep, setEmailStep] = useState<'email' | 'verify' | 'done'>('email');
  const [emailBusy, setEmailBusy] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState<string>('');

  // --- Set password (OAuth) ---
  const [oauthNewPw, setOauthNewPw] = useState('');
  const [oauthConfirmPw, setOauthConfirmPw] = useState('');
  const [oauthBusy, setOauthBusy] = useState(false);
  const oauthStrength = oauthNewPw ? getPasswordStrength(oauthNewPw) : null;

  // --- Membership ---
  const [membershipBusy, setMembershipBusy] = useState(false);

  // Detect OAuth user: no password in mock. For mock, we use a `hasPassword` flag
  // on the user object (defaults true; flips to false when user signs in with Google).
  const isOAuthUser = (user as { hasPassword?: boolean } | null)?.hasPassword === false;

  if (!user) return null;

  const inputCls = 'w-full px-3 py-2.5 text-sm border border-gray-200 focus:border-black focus:outline-none bg-white';

  function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwError(null);
    setBreachWarning(null);
    if (!currentPw || !newPw || !confirmPw) {
      setPwError('Please fill in every field');
      return;
    }
    if (newPw !== confirmPw) {
      setPwError('New passwords do not match');
      return;
    }
    if (newPwStrength && newPwStrength.score < 3) {
      setPwError(`Password is too weak: ${newPwStrength.label}. Choose a stronger one.`);
      return;
    }
    // Rate limiter
    const allowed = canAttempt('change-password', 5, 15 * 60 * 1000);
    if (!allowed.allowed) {
      showToast(`Too many attempts. Try again in ${Math.ceil((allowed.retryAfterSec ?? 0) / 60)} min.`, 'error');
      return;
    }
    recordAttempt('change-password');
    setPwBusy(true);
    // Mock: in production POST /api/auth/change-password with currentPw + newPw.
    // Backend hashes + persists + invalidates other sessions.
    (async () => {
      await new Promise((r) => setTimeout(r, 800));
      // Breach check
      const result = await checkPasswordBreached(newPw);
      if (result.breached && !breachOverride) {
        setBreachWarning(result);
        setPwBusy(false);
        return;
      }
      // Backend hook
      if (dashboardUser) {
        broadcast(
          {
            title: 'Password changed',
            body: 'Your Havanat password was just changed. If this wasn\u2019t you, please contact support immediately.',
            category: 'system',
            channels: 'email',
            scope: 'user',
            targetUserId: user!.id,
          },
          { id: 'system', name: 'Havanat', role: 'system' }
        );
      }
      resetAttempts('change-password');
      setPwBusy(false);
      showToast('Password updated. All other sessions have been signed out.', 'success');
      setCurrentPw(''); setNewPw(''); setConfirmPw(''); setBreachOverride(false);
    })();
  }

  function requestEmailOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!newEmail || !newEmail.includes('@')) {
      showToast('Enter a valid email', 'error');
      return;
    }
    setEmailBusy(true);
    // Mock: backend generates 6-digit OTP, stores hashed + expiry, emails user.
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    setGeneratedOtp(otp);
    console.info(`[mock-email] To: ${newEmail} — Your Havanat email-verification code is ${otp}. It expires in 10 minutes.`);
    setEmailStep('verify');
    setEmailBusy(false);
    showToast(`Verification code sent to ${newEmail}`, 'success');
  }

  function verifyEmailOtp(e: React.FormEvent) {
    e.preventDefault();
    if (emailOtp !== generatedOtp) {
      showToast('Invalid code', 'error');
      return;
    }
    setEmailStep('done');
    showToast('Email updated. Check your inbox for confirmation.', 'success');
    broadcast(
      {
        title: 'Email address changed',
        body: 'Your Havanat login email was just updated. If this wasn\u2019t you, contact support immediately.',
        category: 'system',
        channels: 'email',
        scope: 'user',
        targetUserId: user!.id,
      },
      { id: 'system', name: 'Havanat', role: 'system' }
    );
    setNewEmail(''); setEmailOtp(''); setGeneratedOtp('');
  }

  function setOAuthPassword(e: React.FormEvent) {
    e.preventDefault();
    if (oauthNewPw !== oauthConfirmPw) {
      showToast('Passwords do not match', 'error');
      return;
    }
    if (oauthStrength && oauthStrength.score < 3) {
      showToast(`Password too weak: ${oauthStrength.label}`, 'error');
      return;
    }
    setOauthBusy(true);
    setTimeout(() => {
      setOauthBusy(false);
      (user as { hasPassword?: boolean }).hasPassword = true;
      showToast('Password set. You can now sign in with email + password.', 'success');
      setOauthNewPw(''); setOauthConfirmPw('');
    }, 800);
  }

  function changeMembership(tier: 'Standard' | 'Deluxe' | 'Elite') {
    setMembershipBusy(true);
    setTimeout(() => {
      if (dashboardUser) {
        useAuthStore.getState().upgradeTier(tier === 'Standard' ? 'standard' : tier === 'Deluxe' ? 'deluxe' : 'elite');
      }
      setMembershipBusy(false);
      showToast(`Membership updated to ${tier}`, 'success');
    }, 600);
  }

  return (
    <main className="min-h-screen pt-20 lg:pt-24 bg-white">
      <div className="px-4 sm:px-6 lg:px-12 py-8 lg:py-12 max-w-3xl mx-auto">
        <h1 className="font-serif text-3xl sm:text-4xl mb-2">Account Settings</h1>
        <p className="text-sm text-gray-500 mb-8">Manage your password, email, and membership tier.</p>

        <div className="border border-gray-200 mb-6 flex overflow-x-auto">
          {([
            { key: 'password', label: isOAuthUser ? 'Set password' : 'Change password', icon: Lock },
            { key: 'email', label: 'Change email', icon: Mail },
            ...(isOAuthUser ? [{ key: 'oauth-password' as const, label: 'Confirm password', icon: KeyRound }] : []),
            { key: 'membership', label: 'Membership', icon: Crown },
          ]).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setSection(key as Section)}
              className={`flex-1 min-w-[140px] flex items-center justify-center gap-2 px-4 py-3 text-[10px] uppercase tracking-[0.15em] font-medium transition-colors ${
                section === key ? 'bg-black text-white' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Icon size={12} /> {label}
            </button>
          ))}
        </div>

        <div className="border border-gray-200 p-5 sm:p-6">
          {/* Change password */}
          {section === 'password' && (
            <form onSubmit={handleChangePassword} className="space-y-4">
              <h2 className="font-serif text-xl mb-1">Change password</h2>
              <p className="text-sm text-gray-500 mb-4">All other sessions will be signed out when you change your password.</p>
              <div>
                <label className="block text-[10px] uppercase tracking-[0.15em] text-gray-500 mb-1.5 font-semibold">Current password</label>
                <input type="password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} className={inputCls} required />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-[0.15em] text-gray-500 mb-1.5 font-semibold">New password</label>
                <input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} className={inputCls} required />
                {newPwStrength && (
                  <div className="mt-2">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="flex-1 h-1.5 bg-gray-200">
                        <div
                          className={`h-full transition-all ${
                            newPwStrength.score >= 4 ? 'bg-green-600' :
                            newPwStrength.score === 3 ? 'bg-green-500' :
                            newPwStrength.score === 2 ? 'bg-amber-500' :
                            newPwStrength.score === 1 ? 'bg-orange-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${(newPwStrength.score + 1) * 20}%` }}
                        />
                      </div>
                      <span className="text-[10px] uppercase tracking-[0.1em] font-medium">{newPwStrength.label}</span>
                    </div>
                    {newPwStrength.feedback.length > 0 && (
                      <ul className="text-[10px] text-gray-500 space-y-0.5 mt-1">
                        {newPwStrength.feedback.map((f, i) => <li key={i}>• {f}</li>)}
                      </ul>
                    )}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-[0.15em] text-gray-500 mb-1.5 font-semibold">Confirm new password</label>
                <input type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} className={inputCls} required />
              </div>
              {pwError && (
                <div className="bg-red-50 border border-red-200 p-3 text-sm text-red-700 flex items-start gap-2">
                  <AlertCircle size={16} className="flex-shrink-0 mt-0.5" /> {pwError}
                </div>
              )}
              {breachWarning && breachWarning.breached && (
                <div className="bg-amber-50 border border-amber-200 p-4 text-sm">
                  <p className="font-semibold text-amber-800 mb-1">This password has been seen in {breachWarning.count.toLocaleString()} data breaches.</p>
                  <p className="text-amber-700 text-xs mb-3">We strongly recommend choosing a different password. You can override this warning, but doing so is at your own risk.</p>
                  <label className="flex items-center gap-2 text-xs">
                    <input type="checkbox" checked={breachOverride} onChange={(e) => setBreachOverride(e.target.checked)} className="w-4 h-4 accent-black" />
                    Use this password anyway
                  </label>
                </div>
              )}
              <button type="submit" disabled={pwBusy} className="px-5 py-3 bg-black text-white text-[10px] uppercase tracking-[0.15em] font-medium disabled:opacity-40">
                {pwBusy ? 'Updating…' : 'Update password'}
              </button>
            </form>
          )}

          {/* Change email (OTP) */}
          {section === 'email' && (
            <div>
              <h2 className="font-serif text-xl mb-1">Change email</h2>
              <p className="text-sm text-gray-500 mb-4">We'll send a 6-digit code to the new address to confirm it's yours.</p>
              {emailStep === 'email' && (
                <form onSubmit={requestEmailOtp} className="space-y-4">
                  <div>
                    <label className="block text-[10px] uppercase tracking-[0.15em] text-gray-500 mb-1.5 font-semibold">New email</label>
                    <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className={inputCls} placeholder="you@example.com" required />
                  </div>
                  <button type="submit" disabled={emailBusy} className="px-5 py-3 bg-black text-white text-[10px] uppercase tracking-[0.15em] font-medium disabled:opacity-40">
                    {emailBusy ? 'Sending…' : 'Send verification code'}
                  </button>
                </form>
              )}
              {emailStep === 'verify' && (
                <form onSubmit={verifyEmailOtp} className="space-y-4">
                  <p className="text-sm">Code sent to <strong>{newEmail}</strong>. Enter it below.</p>
                  <div>
                    <label className="block text-[10px] uppercase tracking-[0.15em] text-gray-500 mb-1.5 font-semibold">6-digit code</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      pattern="[0-9]{6}"
                      value={emailOtp}
                      onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, ''))}
                      className={`${inputCls} tracking-[0.4em] text-center font-serif text-2xl`}
                      required
                    />
                    <p className="text-[10px] text-gray-400 mt-2">Mock: any code you enter here is accepted in dev. In production the code is verified server-side.</p>
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" className="px-5 py-3 bg-black text-white text-[10px] uppercase tracking-[0.15em] font-medium">Verify &amp; update</button>
                    <button type="button" onClick={() => setEmailStep('email')} className="px-5 py-3 border text-[10px] uppercase tracking-[0.15em]">Change email</button>
                  </div>
                </form>
              )}
              {emailStep === 'done' && (
                <div className="text-center py-6">
                  <Shield className="h-10 w-10 text-green-600 mx-auto mb-3" />
                  <p className="text-sm text-gray-600 mb-4">Email updated successfully.</p>
                  <button onClick={() => setEmailStep('email')} className="text-[10px] uppercase tracking-[0.15em] underline">Change again</button>
                </div>
              )}
            </div>
          )}

          {/* Set password (OAuth users) */}
          {section === 'oauth-password' && (
            <form onSubmit={setOAuthPassword} className="space-y-4">
              <h2 className="font-serif text-xl mb-1">Set a password</h2>
              <p className="text-sm text-gray-500 mb-4">You signed in with Google and don&apos;t have a password yet. Add one so you can also sign in with email.</p>
              <div>
                <label className="block text-[10px] uppercase tracking-[0.15em] text-gray-500 mb-1.5 font-semibold">New password</label>
                <input type="password" value={oauthNewPw} onChange={(e) => setOauthNewPw(e.target.value)} className={inputCls} required />
                {oauthStrength && (
                  <p className="text-[10px] uppercase tracking-[0.1em] text-gray-500 mt-1">Strength: {oauthStrength.label}</p>
                )}
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-[0.15em] text-gray-500 mb-1.5 font-semibold">Confirm</label>
                <input type="password" value={oauthConfirmPw} onChange={(e) => setOauthConfirmPw(e.target.value)} className={inputCls} required />
              </div>
              <button type="submit" disabled={oauthBusy} className="px-5 py-3 bg-black text-white text-[10px] uppercase tracking-[0.15em] font-medium disabled:opacity-40">
                {oauthBusy ? 'Saving…' : 'Set password'}
              </button>
            </form>
          )}

          {/* Membership */}
          {section === 'membership' && (
            <div>
              <h2 className="font-serif text-xl mb-1">Membership tier</h2>
              <p className="text-sm text-gray-500 mb-5">Current tier: <strong className="uppercase tracking-wide">{user.membershipTier}</strong></p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(['Standard', 'Deluxe', 'Elite'] as const).map((tier) => {
                  const active = user!.membershipTier.toLowerCase() === tier.toLowerCase();
                  const desc = tier === 'Standard' ? 'Base pricing on all items.' : tier === 'Deluxe' ? 'Per-item discount set by admins (default 5%).' : 'Per-item discount set by admins (default 10%) + early access.';
                  return (
                    <button
                      key={tier}
                      onClick={() => changeMembership(tier)}
                      disabled={active || membershipBusy}
                      className={`p-4 border text-left transition-colors ${
                        active ? 'border-black bg-gray-50 cursor-default' : 'border-gray-200 hover:border-black'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Crown size={14} className={active ? 'text-black' : 'text-gray-400'} />
                        <span className="text-xs uppercase tracking-[0.15em] font-semibold">{tier}</span>
                        {active && <span className="text-[9px] uppercase tracking-[0.15em] text-gray-500 ml-auto">Current</span>}
                      </div>
                      <p className="text-xs text-gray-500">{desc}</p>
                    </button>
                  );
                })}
              </div>
              <p className="text-[10px] text-gray-400 mt-4">In production, tier upgrades are paid via Paystack. The mock switches tier instantly for testing.</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}