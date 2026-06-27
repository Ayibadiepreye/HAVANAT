// EmailVerificationBanner — shows on Account page when user.emailVerified === false.
// Lets the user either:
//   - Enter the 6-digit OTP we sent them
//   - Resend the code (calls /api/auth/oauth/verify-email/send)
//
// Once verified, refreshes the user state and disappears.

import { useEffect, useState } from 'react';
import { Mail, X, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/useAuthStore';
import { useUIStore } from '@/stores/useUIStore';

export default function EmailVerificationBanner() {
  const user = useAuthStore((s) => s.user);
  const dashboardUser = useAuthStore((s) => s.dashboardUser);
  const showToast = useUIStore((s) => s.showToast);
  const [dismissed, setDismissed] = useState(false);
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sending, setSending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const needsVerification = dashboardUser && dashboardUser.emailVerified === false;

  // Cooldown ticker
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const id = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [resendCooldown]);

  // Auto-send code on first show (only once per page load)
  useEffect(() => {
    if (needsVerification && !sending && resendCooldown === 0) {
      void handleSend();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [needsVerification]);

  async function handleSend() {
    if (resendCooldown > 0) return;
    setSending(true);
    setError(null);
    try {
      const token = localStorage.getItem('havanat-access-token') ?? '';
      const res = await fetch('/api/auth/oauth/verify-email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: ['Bearer', token].join(' '),
        },
        body: JSON.stringify({}),
      });
      const data = await res.json().catch(() => ({}));
      if (data.alreadyVerified) {
        // Server says we're verified — refresh
        await refreshUser();
        return;
      }
      if (data.emailSent === false) {
        setError('Failed to send email. Try again in a moment.');
        return;
      }
      showToast('Verification code sent to your email', 'success');
      setResendCooldown(60);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to send');
    } finally {
      setSending(false);
    }
  }

  async function refreshUser() {
    try {
      const data = await api<{ user: any }>('/api/auth/me', { auth: true });
      const u = data.user;
      // Update dashboardUser in auth store
      useAuthStore.setState((state) => ({
        dashboardUser: state.dashboardUser
          ? { ...state.dashboardUser, emailVerified: u.emailVerified }
          : null,
      }));
    } catch {}
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (code.length !== 6) {
      setError('Enter the 6-digit code from your email');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const token = localStorage.getItem('havanat-access-token') ?? '';
      const res = await fetch('/api/auth/oauth/verify-email/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: ['Bearer', token].join(' '),
        },
        body: JSON.stringify({ code }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.ok) {
        showToast('Email verified!', 'success');
        await refreshUser();
      } else {
        setError(data.error ?? 'Verification failed');
      }
    } catch (e: any) {
      setError(e?.message ?? 'Verification failed');
    } finally {
      setSubmitting(false);
    }
  }

  if (!needsVerification || dismissed) return null;

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 sm:px-6 lg:px-8 py-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-start gap-3 flex-wrap">
          <Mail size={20} className="text-amber-700 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-amber-900 text-sm">
              Verify your email to use your account
            </h3>
            <p className="text-xs text-amber-800 mt-0.5">
              We sent a 6-digit code to <strong>{dashboardUser?.email ?? user?.email}</strong>.
              Enter it below to unlock ordering, checkout, and membership features.
            </p>
            <form onSubmit={handleVerify} className="flex items-center gap-2 mt-3 flex-wrap">
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="123456"
                className="w-32 px-3 py-2 border border-amber-300 bg-white text-sm tracking-[0.3em] text-center focus:outline-none focus:border-amber-600"
                disabled={submitting}
              />
              <button
                type="submit"
                disabled={submitting || code.length !== 6}
                className="px-4 py-2 bg-amber-700 text-white text-xs uppercase tracking-[0.15em] disabled:opacity-50 hover:bg-amber-800"
              >
                {submitting ? 'Verifying…' : 'Verify'}
              </button>
              <button
                type="button"
                onClick={handleSend}
                disabled={sending || resendCooldown > 0}
                className="px-3 py-2 border border-amber-400 text-amber-900 text-xs uppercase tracking-[0.15em] disabled:opacity-50 hover:bg-amber-100"
              >
                {sending
                  ? 'Sending…'
                  : resendCooldown > 0
                  ? `Resend in ${resendCooldown}s`
                  : 'Resend code'}
              </button>
            </form>
            {error && (
              <p className="text-xs text-red-700 mt-2 flex items-center gap-1">
                <AlertCircle size={12} />
                {error}
              </p>
            )}
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="text-amber-700 hover:text-amber-900 p-1"
            aria-label="Dismiss"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
