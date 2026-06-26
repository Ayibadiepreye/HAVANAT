import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/useAuthStore';
import { useUIStore } from '@/stores/useUIStore';
import { ROLE_HOME } from '@/utils/permissions';

export default function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const signup = useAuthStore((s) => s.signup);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const dashboardUser = useAuthStore((s) => s.dashboardUser);
  const showToast = useUIStore((s) => s.showToast);

  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' });
  const [googleEnabled, setGoogleEnabled] = useState(false);

  useEffect(() => {
    document.title = 'Sign in · Havanat';
    // Check Google OAuth status from backend
    fetch('/api/auth/google/status')
      .then((r) => r.json())
      .then((d) => setGoogleEnabled(!!d.enabled))
      .catch(() => setGoogleEnabled(false));
  }, []);

  useEffect(() => {
    if (isAuthenticated && dashboardUser) {
      navigate(ROLE_HOME[dashboardUser.role], { replace: true });
    }
  }, [isAuthenticated, dashboardUser, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (mode === 'login') {
        const user = await login(form.email, form.password);
        if (user) {
          showToast(`Welcome back, ${user.name}!`, 'success');
          navigate(ROLE_HOME[user.role], { replace: true });
        }
      } else {
        const user = await signup({
          name: form.name,
          email: form.email,
          password: form.password,
          phone: form.phone,
        });
        if (user) {
          showToast('Account created successfully!', 'success');
          navigate(ROLE_HOME[user.role], { replace: true });
        }
      }
    } catch (err: any) {
      showToast(err?.message || 'Authentication failed', 'error');
    }
    setIsLoading(false);
  };

  const inputClass = "w-full px-4 py-3.5 border border-gray-300 text-sm focus:outline-none focus:border-black transition-colors bg-white";

  return (
    <main className="min-h-screen bg-white flex items-center justify-center px-4 sm:px-6 py-8 sm:py-12">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="text-center mb-8 sm:mb-10">
          <Link to="/" className="font-serif text-3xl tracking-[0.3em] font-medium inline-block">
            HAVANAT
          </Link>
          <p className="text-gray-500 text-xs tracking-[0.2em] uppercase mt-3">
            {mode === 'login' ? 'Welcome back' : 'Create your account'}
          </p>
        </div>

        {/* Form */}
        <div className="space-y-3 mb-6 sm:mb-8">
          <button
            onClick={() => showToast('Google login coming soon', 'info')}
            className="w-full py-3 border border-gray-300 flex items-center justify-center gap-3 text-sm hover:bg-gray-50 transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>
        </div>

        <div className="flex items-center gap-4 mb-6 sm:mb-8">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-400 tracking-widest">OR</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="block text-[10px] tracking-[0.25em] text-gray-500 mb-2 uppercase font-semibold">Full Name</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className={inputClass}
                placeholder="Enter your full name"
              />
            </div>
          )}
          <div>
            <label className="block text-[10px] tracking-[0.25em] text-gray-500 mb-2 uppercase font-semibold">Email Address</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className={inputClass}
              placeholder="your@email.com"
            />
          </div>
          {mode === 'signup' && (
            <div>
              <label className="block text-[10px] tracking-[0.25em] text-gray-500 mb-2 uppercase font-semibold">Phone Number</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className={inputClass}
                placeholder="+234 800 000 0000"
              />
            </div>
          )}
          <div>
            <label className="block text-[10px] tracking-[0.25em] text-gray-500 mb-2 uppercase font-semibold">Password</label>
            <input
              type="password"
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className={inputClass}
              placeholder={mode === 'signup' ? 'Create a password' : 'Enter your password'}
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 bg-black text-white text-xs tracking-[0.25em] font-semibold hover:bg-black/80 transition-colors disabled:opacity-50 uppercase"
          >
            {isLoading ? 'Please wait...' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>

        {googleEnabled && (
          <>
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs tracking-[0.25em] uppercase">
                <span className="bg-white px-3 text-gray-400">or</span>
              </div>
            </div>
            <button
              type="button"
              onClick={async () => {
                try {
                  showToast('Starting Google sign-in', 'info');
                  setIsLoading(true);
                  const r = await fetch('/api/auth/google/url?redirect=/account');
                  const d = await r.json();
                  if (d.url) window.location.href = d.url;
                  else showToast('Google sign-in is not available', 'error');
                } catch (e) {
                  showToast('Could not start Google sign-in', 'error');
                } finally {
                  setIsLoading(false);
                }
              }}
              className="w-full py-3.5 bg-white text-black text-xs tracking-[0.25em] font-semibold hover:bg-gray-50 transition-colors uppercase border border-gray-300 flex items-center justify-center gap-3"
            >
              <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
                <path fill="#4285F4" d="M46.1 24.6c0-1.6-.1-3.1-.4-4.6H24v8.7h12.5c-.5 2.8-2.2 5.2-4.7 6.8v5.6h7.6c4.4-4.1 6.9-10.1 6.9-16.5z"/>
                <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.6-5.6c-2.1 1.4-4.8 2.3-8.3 2.3-6.4 0-11.8-4.3-13.7-10.1H2.4v6.3C6.4 42.6 14.6 48 24 48z"/>
                <path fill="#FBBC05" d="M10.3 28.8c-.5-1.4-.8-3-.8-4.8s.3-3.3.8-4.8v-6.3H2.4C.9 16.4 0 20 0 24s.9 7.6 2.4 10.8l7.9-6.0z"/>
                <path fill="#EA4335" d="M24 9.5c3.5 0 6.7 1.2 9.2 3.6l6.9-6.9C35.9 2.4 30.4 0 24 0 14.6 0 6.4 5.4 2.4 13.2l7.9 6.3C12.2 13.8 17.6 9.5 24 9.5z"/>
              </svg>
              Continue with Google
            </button>
          </>
        )}

        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          {mode === 'login' ? (
            <>
              Don&apos;t have an account?{' '}
              <button onClick={() => setMode('signup')} className="text-black underline font-medium">
                Create one
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button onClick={() => setMode('login')} className="text-black underline font-medium">
                Sign in
              </button>
            </>
          )}
        </p>

        <p className="text-center text-xs text-gray-400 mt-8 tracking-wide">
          <Link to="/" className="hover:text-black transition-colors">← Back to home</Link>
        </p>
      </div>
    </main>
  );
}