import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '@/stores/useAuthStore';
import { useUIStore } from '@/stores/useUIStore';
import { apiGet } from '@/lib/api';

export default function GoogleCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const showToast = useUIStore((s) => s.showToast);

  useEffect(() => {
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');
    const redirectTo = params.get('redirect') ?? '/account';
    if (!accessToken) {
      showToast('Google sign-in failed: no token', 'error');
      navigate('/login', { replace: true });
      return;
    }
    localStorage.setItem('havanat-access-token', accessToken);
    if (refreshToken) localStorage.setItem('havanat-refresh-token', refreshToken);
    // Use apiGet — it sets the Authorization header internally via apiConfig.token
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
          },
          isAuthenticated: true,
        });
        showToast(`Welcome, ${u.name}!`, 'success');
        navigate(redirectTo, { replace: true });
      })
      .catch(() => {
        showToast('Google sign-in failed', 'error');
        navigate('/login', { replace: true });
      });
  }, [params, navigate, showToast]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-white pt-20">
      <div className="text-center">
        <p className="font-serif text-2xl mb-3">Signing you in...</p>
        <p className="text-sm text-gray-500">Completing Google sign-in</p>
      </div>
    </main>
  );
}