import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '@/stores/useAuthStore';
import { useUIStore } from '@/stores/useUIStore';
import { apiGet, api } from '@/lib/api';
import { BRAND } from '@/config/brand';

export default function GoogleCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const showToast = useUIStore((s) => s.showToast);
  const [verifyCode, setVerifyCode] = useState('');
  const [verifyBusy, setVerifyBusy] = useState(false);
  const [verifyErr, setVerifyErr] = useState<string | null>(null);
  const [needsVerify, setNeedsVerify] = useState(false);
  const [resendIn, setResendIn] = useState(0);

  // Cooldown ticker for resend
  useEffect(() => {
    if (resendIn <= 0) return;
    const id = setTimeout(() => setResendIn((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [resendIn]);

  // Step 1: hydrate auth from URL tokens, then check if email verification needed
  useEffect(() => {
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');
    const redirectTo = params.get('redirect') ?? '/account';
    const verifyEmail = params.get('verifyEmail') === '1';
    if (!accessToken) {
      showToast('Google sign-in failed: no token', 'error');
      navigate('/login', { replace: true });
      return;
    }
    localStorage.setItem('havanat-access-token', accessToken);
    if (refreshToken) localStorage.setItem('havanat-refresh-token', refreshToken);
    try {
      const existing = JSON.parse(localStorage.getItem('havanat-auth') || '{}');
      existing.state = existing.state || {};
      existing.state.accessToken = accessToken;
      if (refreshToken) existing.state.refreshToken = refreshToken;
      localStorage.setItem('havanat-auth', JSON.stringify(existing));
    } catch {}
    apiGet<{ user: any }>('/api/auth/me', true)
      .then((d) => {
        const u = d.user;
        if (!u) throw new Error('no user');
        useAuthStore.setState({
          user: {
            id: String(u.id),
            name: u.name,
            email: u.email,
            membershipTier: u.tier ?? 'standard',
            phone: u.phone,
            avatar: u.avatar,
            accessToken,
          } as any,
          dashboardUser: {
            id: String(u.id),
            email: u.email,
            name: u.name,
            role: u.role,
            tier: u.tier,
            phone: u.phone,
            avatar: u.avatar,
            createdAt: u.createdAt,
            provider: u.provider,
            hasPassword: u.hasPassword,
            googleId: u.googleId ?? null,
          },
          isAuthenticated: true,
        });
        // If email not yet verified (Google returned verifyEmail=1 OR
        // user object says so), show OTP input
        if (verifyEmail || !u.emailVerified) {
          setNeedsVerify(true);
          setResendIn(30); // OTP was just sent
        } else {
          showToast(`Welcome, ${u.name}!`, 'success');
          navigate(redirectTo, { replace: true });
        }
      })
      .catch(() => {
        showToast('Google sign-in failed', 'error');
        navigate('/login', { replace: true });
      });
  }, [params, navigate, showToast]);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setVerifyErr(null);
    if (verifyCode.length !== 6) {
      setVerifyErr('Enter the 6-digit code we sent to your email.');
      return;
    }
    setVerifyBusy(true);
    try {
      await api('/api/auth/oauth/verify-email/verify', {
        method: 'POST',
        body: { code: verifyCode },
        auth: true,
      });
      showToast('Email verified — welcome!', 'success');
      navigate(params.get('redirect') ?? '/account', { replace: true });
    } catch (err: any) {
      setVerifyErr(err?.message ?? 'Invalid or expired code.');
    } finally {
      setVerifyBusy(false);
    }
  }

  async function handleResend() {
    if (resendIn > 0) return;
    try {
      await api('/api/auth/oauth/verify-email/send', { method: 'POST', auth: true });
      showToast('A new code was sent', 'success');
      setResendIn(30);
    } catch {}
  }

  if (needsVerify) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link to="/" className="font-sans text-2xl tracking-[0.3em] font-medium">
              {BRAND.name.toUpperCase()}
            </Link>
            <p className="text-gray-400 text-xs tracking-wide mt-2">{BRAND.tagline}</p>
          </div>
          <div className="bg-white border border-gray-200 p-6 sm:p-8">
            <h1 className="font-serif text-2xl font-light mb-2">Verify your email</h1>
            <p className="text-sm text-gray-500 mb-6">
              We sent a 6-digit code to your email. Enter it below to finish setting up your account.
            </p>
            <form onSubmit={handleVerify} className="space-y-4">
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                className="w-full px-3 py-3 text-base border border-gray-200 focus:border-black focus:outline-none bg-white tracking-[0.4em] text-center font-serif text-2xl"
                autoFocus
              />
              {verifyErr && <p className="text-sm text-red-600">{verifyErr}</p>}
              <button
                type="submit"
                disabled={verifyBusy || verifyCode.length !== 6}
                className="w-full py-4 bg-black text-white text-xs uppercase tracking-[0.2em] font-medium hover:bg-gray-900 disabled:opacity-50"
              >
                {verifyBusy ? 'Verifying…' : 'Verify email'}
              </button>
            </form>
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={handleResend}
                disabled={resendIn > 0}
                className="text-xs text-gray-500 hover:text-black underline disabled:opacity-30"
              >
                {resendIn > 0 ? `Resend in ${resendIn}s` : 'Resend code'}
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-white pt-20">
      <div className="text-center">
        <p className="font-serif text-2xl mb-3">Signing you in...</p>
        <p className="text-sm text-gray-500">Completing Google sign-in</p>
      </div>
    </main>
  );
}

// Need to import Link for the brand header
import { Link } from 'react-router-dom';