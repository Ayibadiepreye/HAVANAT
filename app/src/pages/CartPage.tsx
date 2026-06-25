import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingBag, MessageCircle, MapPin } from 'lucide-react';
import { useCartStore } from '@/stores/useCartStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { useAddressStore } from '@/stores/useAddressStore';
import { useDeliveryZones } from '@/hooks/useDeliveryZones';
import { formatNaira, CONFIG } from '@/config';
import { NIGERIAN_STATES } from '@/pages/CheckoutPage';

function buildWhatsAppOrderMessage(state: string): string {
  const { items, subtotal } = useCartStore.getState();
  const lines = items.map((i) => `• ${i.product.name} (Size ${i.size}) ×${i.quantity} — ${formatNaira(i.product.price * i.quantity)}`);
  const total = formatNaira(subtotal());
  return `Hi Havanat, I'd like to place an order:%0A%0A${encodeURIComponent(lines.join('\n'))}%0A%0ASubtotal: ${total}%0ADelivery to: ${state}%0A%0APlease confirm availability and delivery fee.`;
}

export default function CartPage() {
  const { items, updateQuantity, removeItem, subtotal, deliveryFee, total, deliveryState, setDeliveryState, tierDiscount } = useCartStore();
  const isAuthed = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const defaultAddress = useAddressStore((s) => s.addresses.find((a) => a.isDefault) ?? s.addresses[0]);
  const { zoneFeeByState } = useDeliveryZones();
  const [state, setState] = useState<string>(deliveryState || defaultAddress?.state || '');

  // Keep cart store's deliveryState in sync
  useEffect(() => {
    if (state && state !== deliveryState) setDeliveryState(state);
  }, [state, deliveryState, setDeliveryState]);

  if (items.length === 0) {
    return (
      <main className="min-h-screen pt-20 lg:pt-24 bg-white">
        <div className="max-w-2xl mx-auto px-4 py-24 text-center">
          <ShoppingBag className="h-12 w-12 mx-auto mb-4 text-gray-300" strokeWidth={1} />
          <h1 className="font-serif text-3xl mb-3">Your cart is empty</h1>
          <p className="text-sm text-gray-500 mb-6">Looks like you haven't added anything yet. Browse the collection.</p>
          <Link to="/shop" className="inline-block px-8 py-3 bg-black text-white text-xs tracking-[0.15em] font-semibold">
            SHOP NOW
          </Link>
        </div>
      </main>
    );
  }

  const tier = user?.membershipTier ?? 'standard';
  const delivery = deliveryFee(zoneFeeByState);
  const finalTotal = total(tier, zoneFeeByState);

  return (
    <main className="min-h-screen pt-20 lg:pt-24 bg-white">
      <div className="px-4 sm:px-6 lg:px-12 py-8 lg:py-12 max-w-6xl mx-auto">
        <h1 className="font-serif text-3xl sm:text-4xl mb-8">Your Cart</h1>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
          <div className="lg:col-span-2 space-y-4">
            {items.map((it) => {
              const outOfStock = it.product.stock <= 0;
              const lowStock = it.product.stock > 0 && it.product.stock <= (it.product.lowStockThreshold ?? 5);
              return (
                <div key={`${it.product.id}-${it.size}`} className="flex gap-3 sm:gap-4 p-3 sm:p-4 border border-gray-200">
                  <div className="w-20 h-24 sm:w-24 sm:h-28 bg-gray-100 flex-shrink-0 overflow-hidden">
                    <img src={it.product.images[0]} alt={it.product.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="font-serif text-base sm:text-lg truncate">{it.product.name}</p>
                      <button
                        onClick={() => removeItem(it.product.id, it.size)}
                        className="text-gray-400 hover:text-red-600 p-1 -mt-1"
                        aria-label="Remove"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mb-1">Size {it.size}</p>
                    <p className="text-sm font-medium mb-2">{formatNaira(it.product.price)}</p>
                    {outOfStock && (
                      <p className="text-[10px] uppercase tracking-[0.15em] text-red-600 mb-2 font-semibold">Out of stock</p>
                    )}
                    {!outOfStock && lowStock && (
                      <p className="text-[10px] uppercase tracking-[0.15em] text-amber-700 mb-2 font-semibold">
                        Only {it.product.stock} left
                      </p>
                    )}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(it.product.id, it.size, it.quantity - 1)}
                        className="w-7 h-7 border border-gray-200 hover:border-black flex items-center justify-center"
                        aria-label="Decrease quantity"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="w-6 text-center text-sm">{it.quantity}</span>
                      <button
                        onClick={() => updateQuantity(it.product.id, it.size, it.quantity + 1)}
                        disabled={it.quantity >= it.product.stock}
                        className="w-7 h-7 border border-gray-200 hover:border-black flex items-center justify-center disabled:opacity-30"
                        aria-label="Increase quantity"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Summary */}
          <div className="lg:sticky lg:top-24 h-fit">
            <div className="border p-5 lg:p-6">
              <h2 className="text-xs tracking-[0.15em] font-semibold mb-5 uppercase">Order Summary</h2>

              {/* Delivery state picker */}
              <div className="mb-5">
                <label className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.15em] text-gray-500 mb-1.5 font-semibold">
                  <MapPin size={11} /> Deliver to
                </label>
                <select
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 focus:border-black focus:outline-none bg-white"
                >
                  <option value="">Select state</option>
                  {NIGERIAN_STATES.map((s) => (
                    <option key={s} value={s}>
                      {s} — {formatNaira(zoneFeeByState[s] ?? zoneFeeByState['default'] ?? CONFIG.DEFAULT_DELIVERY_FEE)} delivery
                    </option>
                  ))}
                </select>
                {state && (
                  <p className="text-[10px] text-gray-400 mt-1.5">
                    Estimated delivery: 2-5 business days
                  </p>
                )}
              </div>

              <div className="space-y-2 text-sm mb-5">
                <div className="flex justify-between">
                  <span className="text-gray-500">Subtotal</span>
                  <span>{formatNaira(subtotal())}</span>
                </div>
                {tierDiscount(tier) > 0 && (
                  <div className="flex justify-between text-green-700">
                    <span>Tier discount ({tier})</span>
                    <span>-{formatNaira(tierDiscount(tier))}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">Delivery{state ? ` to ${state}` : ''}</span>
                  <span>{state ? formatNaira(delivery) : '—'}</span>
                </div>
              </div>
              <div className="flex justify-between text-base font-semibold py-3 border-t">
                <span>Total</span>
                <span>{formatNaira(finalTotal)}</span>
              </div>
              <Link
                to={isAuthed ? '/checkout' : '/login?redirect=/checkout'}
                className="block w-full py-4 mt-4 bg-black text-white text-center text-xs tracking-[0.15em] font-semibold hover:bg-gray-900 transition-colors"
              >
                {isAuthed ? 'PROCEED TO CHECKOUT' : 'SIGN IN TO CHECKOUT'}
              </Link>
              <a
                href={`https://wa.me/${CONFIG.SOCIAL.WHATSAPP.replace('https://wa.me/', '')}?text=${buildWhatsAppOrderMessage(state || '—')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 mt-3 text-center text-xs tracking-[0.1em] border border-green-600 text-green-700 hover:bg-green-50 transition-colors font-medium"
              >
                <MessageCircle className="h-3.5 w-3.5" /> Order via WhatsApp
              </a>
              <Link
                to="/shop"
                className="block w-full py-3 mt-2 text-center text-xs tracking-[0.1em] text-gray-400 hover:text-black transition-colors"
              >
                Continue shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}