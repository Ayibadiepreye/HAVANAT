import { useEffect, useState } from 'react';
import { canAttempt, recordAttempt, resetAttempts, formatRetryAfter } from '@/utils/rateLimiter';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, CheckCircle2, ArrowLeft, Mail } from 'lucide-react';
import { useUIStore } from '@/stores/useUIStore';
import { BRAND } from '@/config/brand';

const STORAGE_KEY = 'havanat-password-reset';

interface ResetState {
  email: string;
  step: 'email' | 'reset' | 'done';
}

function loadState(): ResetState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ResetState;
  } catch {
    return null;
  }
}

function saveState(state: ResetState) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

function clearState() {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tokenFromUrl = searchParams.get('token');
  const showToast = useUIStore((s) => s.showToast);

  // Restore from localStorage so a refresh keeps you where you were.
  const initial = loadState();
  const [email, setEmail] = useState<string>(initial?.email ?? '');
  const [step, setStep] = useState<'email' | 'reset' | 'done'>(initial?.step ?? 'email');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [generatedOtp, setGeneratedOtp] = useState<string>('');

  useEffect(() => {
    if (email) saveState({ email, step });
  }, [email, step]);

  // If arriving from a password-reset email link, validate the token
  // and jump straight to the 'reset' step.
  useEffect(() => {
    if (!tokenFromUrl) return;
    (async () => {
      try {
        const r = await fetch(`/api/auth/reset-password?token=${encodeURIComponent(tokenFromUrl)}`, { method: 'GET' });
        if (!r.ok) {
          setError('This reset link is invalid or has expired. Please request a new one.');
          setStep('email');
          return;
        }
        const d = await r.json();
        if (d.email) {
          setEmail(d.email);
          setStep('reset');
          showToast('Reset link verified. Choose a new password.', 'success');
        }
      } catch (e) {
        setError('Could not verify reset link. Please request a new one.');
        setStep('email');
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokenFromUrl]);

  const inputClass =
    'w-full px-4 py-3.5 border text-sm focus:outline-none focus:border-black transition-colors bg-white';

  // ───── Step 1: collect email ─────
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    const allowed = canAttempt('forgot-password', 5, 15 * 60 * 1000);
    if (!allowed.allowed) {
      setError(`Too many attempts. ${formatRetryAfter(allowed.retryAfterSec ?? 0)} until you can try again.`);
      showToast(`Locked out. Try again in ${formatRetryAfter(allowed.retryAfterSec ?? 0)}.`, 'error');
      return;
    }
    recordAttempt('forgot-password');
    setSubmitting(true);
    // Mock: in production POST /api/auth/forgot-password. Server returns 200 always.
    await new Promise((r) => setTimeout(r, 700));
    // Generate a 6-digit OTP (mock) and log it
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    setGeneratedOtp(otp);
    // eslint-disable-next-line no-console
    console.info(`[mock-email] To: ${email} — Your Havanat password-reset code is ${otp}. Expires in 10 minutes.`);
    setSubmitting(false);
    setStep('reset');
    showToast('Check your email for the verification code', 'success');
    setResendCountdown(30);
  };

  // Cooldown ticker for the resend button
  useEffect(() => {
    if (resendCountdown <= 0) return;
    const id = setTimeout(() => setResendCountdown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [resendCountdown]);

  function handleResend(): void {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _unused: typeof handleResend | null = handleResend; void _unused;
    if (resendCountdown > 0) return;
    const allowed = canAttempt('forgot-password', 5, 15 * 60 * 1000);
    if (!allowed.allowed) {
      showToast(`Locked out. Try again in ${formatRetryAfter(allowed.retryAfterSec ?? 0)}.`, 'error');
      return;
    }
    recordAttempt('forgot-password');
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    setGeneratedOtp(otp);
    // eslint-disable-next-line no-console
    console.info(`[mock-email] To: ${email} — Your Havanat password-reset code is ${otp}. (resend)`);
    showToast('A new code was sent to your email', 'success');
    setResendCountdown(30);
  }

  // ───── Step 2: OTP + new password ─────
  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (otp.length !== 6) {
      setError('Enter the 6-digit code we sent to your email.');
      return;
    }
    if (otp !== generatedOtp) {
      setError('That code doesn’t match. Try again or resend.');
      return;
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 800));
    resetAttempts('forgot-password');
    setSubmitting(false);
    setStep('done');
    showToast('Password updated successfully', 'success');
  };

  // ───── Step 3: success → bounce to login ─────
  const handleContinue = () => {
    clearState();
    navigate('/login', { replace: true });
  };

  // ───── Done screen ─────
  if (step === 'done') {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center px-4 sm:px-6 py-12">
        <div className="w-full max-w-md text-center">
          <CheckCircle2 size={64} strokeWidth={1} className="mx-auto mb-6 text-black" />
          <h1 className="font-serif text-3xl sm:text-4xl font-light mb-3">Password updated</h1>
          <p className="text-sm text-gray-500 mb-8">
            Your {BRAND.name} password has been reset. You can now sign in with your new password.
          </p>
          <button
            type="button"
            onClick={handleContinue}
            className="w-full py-4 bg-black text-white text-xs uppercase tracking-[0.2em] font-medium hover:bg-gray-900 transition-colors"
          >
            Continue to sign in
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white flex items-center justify-center px-4 sm:px-6 py-8 sm:py-12">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="text-center mb-8 sm:mb-10">
          <Link to="/" className="font-sans text-2xl tracking-[0.3em] font-medium">
            {BRAND.name.toUpperCase()}
          </Link>
          <p className="text-gray-400 text-xs tracking-wide mt-2">{BRAND.tagline}</p>
        </div>

        <div className="bg-white border border-gray-200 p-6 sm:p-8">
          {/* Header */}
          <div className="mb-6">
            <h1 className="font-serif text-2xl sm:text-3xl font-light">
              {step === 'email' ? 'Reset your password' : 'Set a new password'}
            </h1>
            <p className="text-sm text-gray-500 mt-2">
              {step === 'email'
                ? `Enter the email tied to your ${BRAND.name} account and we'll send you a verification code.`
                : `We sent a 6-digit code to ${email}. Enter it below along with a new password.`}
            </p>
          </div>

          {/* Stepper */}
          <div className="flex items-center gap-2 mb-8">
            <div
              className={`flex-1 h-0.5 transition-colors ${
                step === 'email' ? 'bg-gray-200' : 'bg-black'
              }`}
            />
            <div
              className={`flex-1 h-0.5 transition-colors ${
                step === 'reset' ? 'bg-black' : 'bg-gray-200'
              }`}
            />
          </div>

          {step === 'email' ? (
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase tracking-[0.25em] text-gray-400 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`${inputClass} pr-11`}
                    placeholder="your@email.com"
                    autoComplete="email"
                    autoFocus
                  />
                  <Mail
                    size={16}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                  />
                </div>
              </div>

              {error && (
                <p className="text-xs text-error-red-600" role="alert">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 bg-black text-white text-xs uppercase tracking-[0.2em] font-medium hover:bg-gray-900 transition-colors disabled:opacity-50"
              >
                {submitting ? 'Sending...' : 'Send verification code'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase tracking-[0.25em] text-gray-400 mb-2">
                  Verification Code
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className={`${inputClass} tracking-[0.5em] text-center font-mono text-lg`}
                  placeholder="000000"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleResend}
                  className="text-[10px] uppercase tracking-[0.2em] text-gray-400 hover:text-black mt-2 transition-colors"
                >
                  Resend code
                </button>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-[0.25em] text-gray-400 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNew ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className={`${inputClass} pr-12`}
                    placeholder="At least 8 characters"
                    autoComplete="new-password"
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black transition-colors p-1"
                    aria-label={showNew ? 'Hide password' : 'Show password'}
                  >
                    {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-[0.25em] text-gray-400 mb-2">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`${inputClass} pr-12 ${
                      confirmPassword && newPassword !== confirmPassword
                        ? 'border-error-red-600'
                        : ''
                    }`}
                    placeholder="Re-enter your new password"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black transition-colors p-1"
                    aria-label={showConfirm ? 'Hide password' : 'Show password'}
                  >
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {error && (
                <p className="text-xs text-error-red-600" role="alert">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 bg-black text-white text-xs uppercase tracking-[0.2em] font-medium hover:bg-gray-900 transition-colors disabled:opacity-50"
              >
                {submitting ? 'Updating...' : 'Update password'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setStep('email');
                  setOtp('');
                  setNewPassword('');
                  setConfirmPassword('');
                  setError(null);
                }}
                className="w-full text-[10px] uppercase tracking-[0.2em] text-gray-400 hover:text-black transition-colors"
              >
                Use a different email
              </button>
            </form>
          )}
        </div>

        <div className="flex items-center justify-between mt-6 text-xs text-gray-400">
          <Link to="/login" className="inline-flex items-center gap-1 hover:text-black transition-colors">
            <ArrowLeft size={12} />
            Back to sign in
          </Link>
          <Link to="/" className="hover:text-black transition-colors">
            Home
          </Link>
        </div>
      </div>
    </main>
  );
}