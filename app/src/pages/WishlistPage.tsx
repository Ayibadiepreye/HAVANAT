import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, Bell, Trash2, X, ArrowRight } from 'lucide-react';
import { useProductStore } from '@/stores/useProductStore';
import { useCartStore } from '@/stores/useCartStore';
import { useUIStore } from '@/stores/useUIStore';
import { formatNaira } from '@/config';
import { BRAND } from '@/config/brand';
import type { Product } from '@/types';

const NOTIFY_KEY = 'havanat-wishlist-notify';

function readNotifySet(): number[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(NOTIFY_KEY);
    return raw ? (JSON.parse(raw) as number[]) : [];
  } catch {
    return [];
  }
}

function writeNotifySet(ids: number[]) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(NOTIFY_KEY, JSON.stringify(ids));
  } catch {
    /* ignore */
  }
}

export default function WishlistPage() {
  const wishlist = useProductStore((s) => s.wishlist);
  const toggleWishlist = useProductStore((s) => s.toggleWishlist);
  const fetchProducts = useProductStore((s) => s.fetchProducts);
  const products = useProductStore((s) => s.products);
  const addItem = useCartStore((s) => s.addItem);
  const openCart = useCartStore((s) => s.openCart);
  const showToast = useUIStore((s) => s.showToast);

  const [notifyIds, setNotifyIds] = useState<number[]>(readNotifySet);

  useEffect(() => {
    if (products.length === 0) fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const wishlistProducts: Product[] = products.filter((p) => wishlist.includes(p.id));
  const count = wishlistProducts.length;

  const updateNotify = (id: number, next: boolean) => {
    const updated = next
      ? Array.from(new Set([...notifyIds, id]))
      : notifyIds.filter((n) => n !== id);
    setNotifyIds(updated);
    writeNotifySet(updated);
    showToast(
      next
        ? "You'll be notified when this piece goes on sale"
        : 'Sale alerts turned off',
      'info'
    );
  };

  const moveAllToCart = () => {
    if (count === 0) return;
    wishlistProducts.forEach((p) => {
      const size = p.sizes[0] ?? 'M';
      addItem(p, size, 1);
    });
    showToast(`${count} ${count === 1 ? 'item' : 'items'} added to your bag`, 'success');
    openCart();
  };

  const removeFromWishlist = (id: number) => {
    toggleWishlist(id);
    showToast('Removed from wishlist', 'info');
  };

  const moveToCart = (p: Product) => {
    const size = p.sizes[0] ?? 'M';
    addItem(p, size, 1);
    toggleWishlist(p.id);
    showToast(`${p.name} moved to bag`, 'success');
    openCart();
  };

  return (
    <main className="min-h-screen pt-20 lg:pt-24 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-4 mb-8 lg:mb-12">
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] text-gray-400 mb-2">
              {BRAND.name}
            </p>
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-light">
              My Wishlist
            </h1>
            <p className="text-sm text-gray-500 mt-2">
              {count === 0
                ? 'Pieces you love, saved for later.'
                : `${count} ${count === 1 ? 'piece' : 'pieces'} curated for you.`}
            </p>
          </div>
          {count > 0 && (
            <button
              type="button"
              onClick={moveAllToCart}
              className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white text-xs uppercase tracking-[0.2em] font-medium hover:bg-gray-900 transition-colors"
            >
              <ShoppingBag size={14} />
              Add all to bag
            </button>
          )}
        </div>

        {count === 0 ? (
          <div className="text-center py-20 border border-dashed border-gray-200">
            <Heart size={56} strokeWidth={1} className="mx-auto mb-4 text-gray-300" />
            <h2 className="font-serif text-2xl mb-2">Your wishlist is empty</h2>
            <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
              Tap the heart on any piece you love — we'll keep it safe here for you.
            </p>
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 px-8 py-3 bg-black text-white text-xs uppercase tracking-[0.2em] hover:bg-gray-900 transition-colors"
            >
              Browse the collection <ArrowRight size={14} />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {wishlistProducts.map((product) => {
              const notify = notifyIds.includes(product.id);
              return (
                <article key={product.id} className="group flex flex-col">
                  <Link
                    to={`/shop/${product.slug}`}
                    className="block relative aspect-[3/4] overflow-hidden bg-gray-100 img-zoom"
                  >
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        removeFromWishlist(product.id);
                      }}
                      className="absolute top-3 right-3 w-9 h-9 bg-white/90 hover:bg-white flex items-center justify-center transition-colors"
                      aria-label="Remove from wishlist"
                    >
                      <X size={14} />
                    </button>
                    {product.isNew && (
                      <span className="absolute top-3 left-3 px-2 py-1 bg-black text-white text-[9px] uppercase tracking-[0.2em]">
                        New
                      </span>
                    )}
                    {product.originalPrice && product.originalPrice > product.price && (
                      <span className="absolute bottom-3 left-3 px-2 py-1 bg-red-600 text-white text-[9px] uppercase tracking-[0.2em]">
                        Sale
                      </span>
                    )}
                  </Link>

                  <div className="pt-4 flex-1 flex flex-col">
                    <Link to={`/shop/${product.slug}`} className="block">
                      <h3 className="text-sm font-medium truncate group-hover:underline underline-offset-4">
                        {product.name}
                      </h3>
                      <p className="text-xs text-gray-400 mt-1">{product.category}</p>
                    </Link>
                    <div className="flex items-baseline gap-2 mt-2">
                      <span className="text-sm font-semibold">
                        {formatNaira(product.price)}
                      </span>
                      {product.originalPrice && product.originalPrice > product.price && (
                        <span className="text-xs text-gray-400 line-through">
                          {formatNaira(product.originalPrice)}
                        </span>
                      )}
                    </div>

                    <div className="mt-auto pt-4 space-y-2">
                      <button
                        type="button"
                        onClick={() => moveToCart(product)}
                        className="w-full py-2.5 bg-black text-white text-xs uppercase tracking-[0.2em] hover:bg-gray-900 transition-colors inline-flex items-center justify-center gap-2"
                      >
                        <ShoppingBag size={12} />
                        Move to bag
                      </button>
                      <div className="flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => removeFromWishlist(product.id)}
                          className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-gray-400 hover:text-black transition-colors"
                        >
                          <Trash2 size={10} /> Remove
                        </button>
                        <button
                          type="button"
                          onClick={() => updateNotify(product.id, !notify)}
                          className={`inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] transition-colors ${
                            notify ? 'text-black' : 'text-gray-400 hover:text-black'
                          }`}
                          aria-pressed={notify}
                        >
                          <Bell size={10} />
                          {notify ? 'Notify on' : 'Notify on sale'}
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}