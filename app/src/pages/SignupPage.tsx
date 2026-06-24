import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useUIStore } from '@/stores/useUIStore';
import { BRAND } from '@/config/brand';

type PasswordStrength = 'empty' | 'weak' | 'fair' | 'good' | 'strong';

interface SignupForm {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  referral: string;
  agree: boolean;
}

function scorePassword(pw: string): { score: number; strength: PasswordStrength } {
  if (!pw) return { score: 0, strength: 'empty' };
  let score = 0;
  if (pw.length >= 8) score += 1;
  if (pw.length >= 12) score += 1;
  if (/[A-Z]/.test(pw)) score += 1;
  if (/[a-z]/.test(pw)) score += 1;
  if (/[0-9]/.test(pw)) score += 1;
  if (/[^A-Za-z0-9]/.test(pw)) score += 1;
  // map to band
  const strength: PasswordStrength =
    score <= 2 ? 'weak' : score === 3 ? 'fair' : score === 4 ? 'good' : 'strong';
  return { score, strength };
}

const STRENGTH_LABEL: Record<PasswordStrength, string> = {
  empty: '',
  weak: 'Weak',
  fair: 'Fair',
  good: 'Good',
  strong: 'Strong',
};

const STRENGTH_BAR: Record<PasswordStrength, string> = {
  empty: 'bg-gray-200',
  weak: 'bg-error-red-600',
  fair: 'bg-warning-amber-500',
  good: 'bg-yellow-600',
  strong: 'bg-success-green-600',
};

const STRENGTH_TEXT: Record<PasswordStrength, string> = {
  empty: 'text-gray-400',
  weak: 'text-error-red-600',
  fair: 'text-warning-amber-500',
  good: 'text-yellow-700',
  strong: 'text-success-green-600',
};

const STRENGTH_SEGMENTS: Record<PasswordStrength, number> = {
  empty: 0,
  weak: 1,
  fair: 2,
  good: 3,
  strong: 4,
};

export default function SignupPage() {
  const navigate = useNavigate();
  const signup = useAuthStore((s) => s.signup);
  const showToast = useUIStore((s) => s.showToast);

  const [form, setForm] = useState<SignupForm>({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    referral: '',
    agree: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { strength } = useMemo(() => scorePassword(form.password), [form.password]);
  const segments = STRENGTH_SEGMENTS[strength];
  const passwordTooShort = form.password.length > 0 && form.password.length < 8;
  const passwordsMatch =
    form.confirmPassword.length > 0 && form.password === form.confirmPassword;
  const passwordsMismatch =
    form.confirmPassword.length > 0 && form.password !== form.confirmPassword;

  const canSubmit =
    form.name.trim().length > 1 &&
    /\S+@\S+\.\S+/.test(form.email) &&
    form.phone.trim().length >= 7 &&
    form.password.length >= 8 &&
    form.password === form.confirmPassword &&
    form.agree &&
    !isLoading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!canSubmit) {
      if (!form.agree) setError('Please agree to the terms to continue.');
      else if (form.password.length < 8) setError('Password must be at least 8 characters.');
      else if (form.password !== form.confirmPassword) setError('Passwords do not match.');
      else setError('Please fill in all required fields correctly.');
      return;
    }
    setIsLoading(true);
    const user = await signup({
      name: form.name.trim(),
      email: form.email.trim(),
      password: form.password,
      phone: form.phone.trim(),
    });
    setIsLoading(false);
    if (user) {
      showToast(`Welcome to ${BRAND.name}, ${user.name.split(' ')[0]}!`, 'success');
      navigate('/account', { replace: true });
    } else {
      setError('Could not create account. Please try again.');
    }
  };

  const inputClass =
    'w-full px-4 py-3.5 border text-sm focus:outline-none focus:border-black transition-colors bg-white';

  return (
    <main className="min-h-screen bg-white flex items-center justify-center px-4 sm:px-6 py-8 sm:py-12">
      <div className="w-full max-w-2xl">
        {/* Brand */}
        <div className="text-center mb-8 sm:mb-10">
          <Link to="/" className="font-sans text-2xl tracking-[0.3em] font-medium">
            {BRAND.name.toUpperCase()}
          </Link>
          <p className="text-gray-400 text-xs tracking-wide mt-2">{BRAND.tagline}</p>
          <h1 className="font-serif text-3xl sm:text-4xl font-light mt-6">Create your account</h1>
          <p className="text-sm text-gray-500 mt-2">
            Join the {BRAND.name} circle — premium Nigerian tailoring, delivered.
          </p>
        </div>

        {/* Social signup */}
        <div className="space-y-3 mb-6">
          <button
            type="button"
            onClick={() => showToast('Google sign-up coming soon', 'info')}
            className="w-full py-3 border flex items-center justify-center gap-3 text-sm hover:bg-gray-50 transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Sign up with Google
          </button>
          <button
            type="button"
            onClick={() => showToast('Apple sign-up coming soon', 'info')}
            className="w-full py-3 border flex items-center justify-center gap-3 text-sm hover:bg-gray-50 transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
            </svg>
            Sign up with Apple
          </button>
        </div>

        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs uppercase tracking-[0.25em] text-gray-400">or sign up with Google</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}
          <div>
            <label className="block text-[10px] uppercase tracking-[0.25em] text-gray-400 mb-2">
              Full Name
            </label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={inputClass}
              placeholder="Enter your full name"
              autoComplete="name"
            />
          </div>

          {/* Email + Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] uppercase tracking-[0.25em] text-gray-400 mb-2">
                Email Address
              </label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className={inputClass}
                placeholder="your@email.com"
                autoComplete="email"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-[0.25em] text-gray-400 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                required
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className={inputClass}
                placeholder="+234 800 000 0000"
                autoComplete="tel"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-[10px] uppercase tracking-[0.25em] text-gray-400 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className={`${inputClass} pr-12`}
                placeholder="Create a password (8+ characters)"
                autoComplete="new-password"
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black transition-colors p-1"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {/* Strength meter */}
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 grid grid-cols-4 gap-1">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={`h-1 transition-colors ${
                      i < segments ? STRENGTH_BAR[strength] : 'bg-gray-200'
                    }`}
                  />
                ))}
              </div>
              <span className={`text-[10px] uppercase tracking-[0.2em] font-medium min-w-[3rem] text-right ${STRENGTH_TEXT[strength]}`}>
                {STRENGTH_LABEL[strength]}
              </span>
            </div>
            {passwordTooShort && (
              <p className="text-xs text-error-red-600 mt-1">
                Use at least 8 characters.
              </p>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-[10px] uppercase tracking-[0.25em] text-gray-400 mb-2">
              Confirm Password
            </label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                required
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                className={`${inputClass} pr-12 ${
                  passwordsMismatch
                    ? 'border-error-red-600'
                    : passwordsMatch
                      ? 'border-success-green-600'
                      : ''
                }`}
                placeholder="Re-enter your password"
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
            {passwordsMismatch && (
              <p className="text-xs text-error-red-600 mt-1">Passwords do not match.</p>
            )}
            {passwordsMatch && (
              <p className="text-xs text-success-green-600 mt-1">Passwords match.</p>
            )}
          </div>

          {/* Referral Code */}
          <div>
            <label className="block text-[10px] uppercase tracking-[0.25em] text-gray-400 mb-2">
              Referral Code <span className="text-gray-300 normal-case">(optional)</span>
            </label>
            <input
              type="text"
              value={form.referral}
              onChange={(e) => setForm({ ...form, referral: e.target.value })}
              className={inputClass}
              placeholder="Enter a referral code if you have one"
            />
          </div>

          {/* Terms */}
          <label className="flex items-start gap-3 cursor-pointer pt-2">
            <input
              type="checkbox"
              checked={form.agree}
              onChange={(e) => setForm({ ...form, agree: e.target.checked })}
              className="mt-1 w-4 h-4 accent-black flex-shrink-0"
            />
            <span className="text-xs text-gray-500 leading-relaxed">
              I agree to {BRAND.name}&apos;s{' '}
              <Link to="/terms" className="underline underline-offset-4 hover:text-black">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link to="/privacy" className="underline underline-offset-4 hover:text-black">
                Privacy Policy
              </Link>
              .
            </span>
          </label>

          {error && (
            <p className="text-xs text-error-red-600 pt-1" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full py-4 bg-black text-white text-xs uppercase tracking-[0.2em] font-medium hover:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {isLoading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-black underline underline-offset-4 font-medium">
            Sign in
          </Link>
        </p>

        <p className="text-center text-xs text-gray-400 mt-6">
          <Link to="/" className="hover:text-black transition-colors">
            ← Back to home
          </Link>
        </p>
      </div>
    </main>
  );
}