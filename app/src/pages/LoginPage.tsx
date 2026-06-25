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

  useEffect(() => {
    if (isAuthenticated && dashboardUser) {
      navigate(ROLE_HOME[dashboardUser.role], { replace: true });
    }
  }, [isAuthenticated, dashboardUser, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (mode === 'login') {
      const user = await login(form.email, form.password);
      if (user) {
        showToast(`Welcome back, ${user.name}!`, 'success');
        navigate(ROLE_HOME[user.role], { replace: true });
      } else {
        showToast('Invalid email or password', 'error');
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
      } else {
        showToast('Something went wrong', 'error');
      }
    }
    setIsLoading(false);
  };

  const inputClass = "w-full px-4 py-3.5 border text-sm focus:outline-none focus:border-black transition-colors bg-white";

  return (
    <main className="min-h-screen bg-white flex items-center justify-center px-4 sm:px-6 py-8 sm:py-12">
      <div className="w-full max-w-4xl">
        {/* Brand */}
        <div className="text-center mb-8 sm:mb-10">
          <Link to="/" className="font-sans text-2xl tracking-[0.3em] font-medium">
            HAVANAT
          </Link>
          <p className="text-gray-400 text-xs tracking-wide mt-2">
            {mode === 'login' ? 'Welcome back' : 'Create your account'}
          </p>
        </div>

        {/* Two-column grid: form on the left, demo accounts on the right (collapses on mobile) */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 md:gap-8">
          {/* Form column */}
          <div className="md:col-span-3">
            {/* Social Login */}
            <div className="space-y-3 mb-6 sm:mb-8">
              <button
                onClick={() => showToast('Google login coming soon', 'info')}
                className="w-full py-3 border flex items-center justify-center gap-3 text-sm hover:bg-gray-50 transition-colors"
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
              <span className="text-xs text-gray-400">OR</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <div>
                  <label className="block text-[10px] tracking-[0.1em] text-gray-400 mb-2 uppercase">Full Name</label>
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
                <label className="block text-[10px] tracking-[0.1em] text-gray-400 mb-2 uppercase">Email Address</label>
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
                  <label className="block text-[10px] tracking-[0.1em] text-gray-400 mb-2 uppercase">Phone Number</label>
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
                <label className="block text-[10px] tracking-[0.1em] text-gray-400 mb-2 uppercase">Password</label>
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
                className="w-full py-4 bg-black text-white text-xs tracking-[0.15em] font-semibold hover:bg-black/80 transition-colors disabled:opacity-50"
              >
                {isLoading ? 'PLEASE WAIT...' : mode === 'login' ? 'SIGN IN' : 'CREATE ACCOUNT'}
              </button>
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
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-8">
          <Link to="/" className="hover:text-black transition-colors">← Back to home</Link>
        </p>
      </div>
    </main>
  );
}
