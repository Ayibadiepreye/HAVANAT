// Sneak Peeks — exclusive drops for Deluxe and Elite members.
//
// Gating rules:
//   - Standard customers: see an "upgrade to Deluxe" hero panel instead of
//     products. The /api/products?sneakPeek=true endpoint returns 403 for
//     them anyway, but we don't even attempt the call.
//   - Deluxe/Elite: the page calls useProductStore.fetchProducts({ sneakPeek:
//     true }) which hits /api/products?sneakPeek=true and returns only the
//     items where is_sneak_peek = true.
//
// Released-at date is shown next to each product (newest first).

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Lock, ArrowRight } from 'lucide-react';
import { useProductStore } from '@/stores/useProductStore';
import { useAuthStore } from '@/stores/useAuthStore';
import type { Product } from '@/types';
import { formatNaira } from '@/config';

export default function SneakPeeksPage() {
  const products = useProductStore((s) => s.products);
  const fetchProducts = useProductStore((s) => s.fetchProducts);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const dashboardUser = useAuthStore((s) => s.dashboardUser);
  // Authoritative tier from the JWT (not the Zustand mirror, which can
  // lag behind an upgrade done mid-session). If the JWT disagrees with
  // dashboardUser.tier, show a "please sign in again" prompt so the user
  // gets a fresh token.
  const jwtTier = (() => {
    try {
      const tok = JSON.parse(localStorage.getItem('havanat-auth') || '{}')?.state?.accessToken;
      if (!tok || typeof tok !== 'string') return null;
      const payload = JSON.parse(atob(tok.split('.')[1]));
      return (payload?.tier ?? null) as string | null;
    } catch { return null; }
  })();
  const tier = jwtTier ?? dashboardUser?.tier ?? null;
  const staleJwt = !!dashboardUser && jwtTier !== null && jwtTier !== dashboardUser.tier;
  const isEligible = tier === 'deluxe' || tier === 'elite';
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isEligible) return;
    setLoading(true);
    setError(null);
    fetchProducts({ sneakPeek: true })
      .then(() => setLoading(false))
      .catch((err: any) => {
        setError(err?.message ?? 'Could not load sneak peeks');
        setLoading(false);
      });
  }, [isEligible, fetchProducts]);

  // If we're not authenticated, gate the page.
  if (!isAuthenticated) {
    return (
      <main className="min-h-screen pt-24 flex items-center justify-center bg-white px-4">
        <div className="text-center max-w-lg">
          <Lock className="mx-auto h-12 w-12 text-gray-300 mb-4" />
          <h1 className="font-serif text-3xl mb-3">Sneak Peeks</h1>
          <p className="text-gray-500 mb-6">Sign in to see exclusive drops reserved for Deluxe and Elite members.</p>
          <Link to="/login" className="inline-block px-8 py-3 bg-black text-white text-[10px] uppercase tracking-[0.2em] font-medium">
            Sign In
          </Link>
        </div>
      </main>
    );
  }

  // If the user's local tier says deluxe/elite but the JWT still says
  // standard, the localStorage has a stale token from before their
  // upgrade. Show a banner prompting them to sign out and back in.
  if (staleJwt) {
    return (
      <main className="min-h-screen pt-24 flex items-center justify-center bg-white px-4">
        <div className="text-center max-w-lg">
          <Sparkles className="mx-auto h-12 w-12 text-purple-500 mb-4" />
          <h1 className="font-serif text-3xl mb-3">Refresh your session</h1>
          <p className="text-gray-500 mb-6">
            Your membership was upgraded but your session token still shows
            your old tier. Sign out and sign back in to see your Sneak Peeks.
          </p>
          <button
            onClick={() => { localStorage.removeItem('havanat-auth'); window.location.href = '/login'; }}
            className="px-8 py-3 bg-black text-white text-[10px] uppercase tracking-[0.2em] font-medium"
          >
            Sign in again
          </button>
        </div>
      </main>
    );
  }

  // Standard-tier authenticated users see the upgrade prompt.
  if (tier === 'standard') {
    return (
      <main className="min-h-screen pt-24 flex items-center justify-center bg-white px-4">
        <div className="text-center max-w-2xl">
          <Sparkles className="mx-auto h-12 w-12 text-purple-500 mb-4" />
          <p className="text-[10px] tracking-[0.3em] text-purple-600 uppercase font-medium mb-2">Members only</p>
          <h1 className="font-serif text-3xl sm:text-4xl mb-4">Sneak Peeks are a Deluxe and Elite privilege</h1>
          <p className="text-gray-500 mb-6">
            Upgrade to Deluxe or Elite to see limited drops before they go public, plus other perks like
            free shipping, member discounts, and priority customer service.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/membership"
              className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-black text-white text-[10px] uppercase tracking-[0.2em] font-medium"
            >
              View membership tiers <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link
              to="/shop"
              className="inline-block px-8 py-3 border border-gray-300 text-[10px] uppercase tracking-[0.2em] font-medium"
            >
              Browse the shop
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // Sort newest-released first
  const sorted = [...(products ?? [])].sort((a, b) => {
    const ad = a.sneakPeekReleasedAt ? new Date(a.sneakPeekReleasedAt).getTime() : 0;
    const bd = b.sneakPeekReleasedAt ? new Date(b.sneakPeekReleasedAt).getTime() : 0;
    return bd - ad;
  });

  return (
    <main className="min-h-screen pt-20 lg:pt-24 bg-white">
      <section className="bg-gradient-to-b from-purple-50 to-white py-12 lg:py-16 px-4 text-center">
        <p className="text-[10px] tracking-[0.3em] text-purple-600 uppercase font-medium mb-2 flex items-center justify-center gap-1.5">
          <Sparkles className="h-3 w-3" /> Sneak Peeks
        </p>
        <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl mb-4">Exclusive Drops</h1>
        <p className="text-gray-500 max-w-xl mx-auto text-sm">
          Limited capsule pieces and special drops — yours before everyone else.
          Welcome to {tier === 'elite' ? 'Elite' : 'Deluxe'}.
        </p>
      </section>

      <section className="px-4 sm:px-6 lg:px-12 py-12 lg:py-16 max-w-7xl mx-auto">
        {loading && (
          <div className="text-center py-16 text-gray-500">Loading sneak peeks…</div>
        )}
        {error && (
          <div className="text-center py-16">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => fetchProducts({ sneakPeek: true })}
              className="px-6 py-3 border border-gray-300 text-[10px] uppercase tracking-[0.2em]"
            >
              Retry
            </button>
          </div>
        )}
        {!loading && !error && sorted.length === 0 && (
          <div className="text-center py-16">
            <Sparkles className="h-8 w-8 mx-auto text-gray-300 mb-3" />
            <h2 className="font-serif text-2xl mb-2">No sneak peeks right now</h2>
            <p className="text-gray-500 text-sm mb-6">When our team releases an exclusive drop, you'll see it here first.</p>
            <Link to="/shop" className="inline-block px-6 py-3 border border-gray-300 text-[10px] uppercase tracking-[0.2em]">
              Browse the shop
            </Link>
          </div>
        )}
        {!loading && !error && sorted.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {sorted.map((p) => (
              <ProductCard key={p.id} p={p} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function ProductCard({ p }: { p: Product }) {
  const released = p.sneakPeekReleasedAt ? new Date(p.sneakPeekReleasedAt) : null;
  return (
    <Link to={`/shop/${p.slug}`} className="group block">
      <div className="relative aspect-[3/4] bg-gray-100 mb-3 overflow-hidden">
        <img
          src={p.images?.[0] ?? ''}
          alt={p.name}
          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-3 left-3 inline-flex items-center gap-1 px-2 py-1 bg-purple-600 text-white text-[10px] uppercase tracking-[0.2em] font-medium">
          <Sparkles className="h-3 w-3" /> Sneak Peek
        </div>
      </div>
      <h3 className="font-medium text-sm">{p.name}</h3>
      <p className="text-sm text-gray-700 mt-1">{formatNaira(Number(p.price))}</p>
      {released && (
        <p className="text-[10px] uppercase tracking-[0.15em] text-purple-600 mt-1">
          Released {released.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
        </p>
      )}
    </Link>
  );
}