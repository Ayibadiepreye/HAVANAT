import { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle, AlertTriangle, Plus, Edit3 } from 'lucide-react';
import { useCartStore } from '@/stores/useCartStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { useUIStore } from '@/stores/useUIStore';
import { useOrderStore } from '@/stores/useOrderStore';
import { useAddressStore, type Address } from '@/stores/useAddressStore';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { useDeliveryZones } from '@/hooks/useDeliveryZones';
import { formatNaira } from '@/config';

// Nigerian states. Sourced from the official 36-state list.
export const NIGERIAN_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue',
  'Borno', 'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT',
  'Gombe', 'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi',
  'Kwara', 'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo',
  'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara',
];

export default function CheckoutPage() {
  const { items, subtotal: cartSubtotal, deliveryFee, total: cartTotal, tierDiscount, clearCart } = useCartStore();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const showToast = useUIStore((s) => s.showToast);
  const createOrder = useOrderStore((s) => s.createOrder);
  const addresses = useAddressStore((s) => s.addresses);
  const addAddress = useAddressStore((s) => s.addAddress);
    const broadcast = useNotificationStore((s) => s.broadcast);
  const navigate = useNavigate();
  const { zoneFeeByState } = useDeliveryZones();

  const defaultAddr = useMemo(() => addresses.find((a) => a.isDefault) ?? addresses[0], [addresses]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>(defaultAddr?.id ?? '');
  const [showNewAddress, setShowNewAddress] = useState(addresses.length === 0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Reset selected address if it gets removed
  useEffect(() => {
    if (selectedAddressId && !addresses.find((a) => a.id === selectedAddressId)) {
      setSelectedAddressId(defaultAddr?.id ?? '');
    }
  }, [addresses, selectedAddressId, defaultAddr]);

  // Inline new-address form state
  const [newAddr, setNewAddr] = useState<Omit<Address, 'id'>>({
    label: 'Home',
    fullName: user?.name ?? '',
    phone: user?.phone ?? '',
    email: user?.email ?? '',
    street: '',
    city: '',
    state: '',
    isDefault: addresses.length === 0,
  });

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen pt-24 flex items-center justify-center bg-white px-4">
        <div className="text-center max-w-md">
          <AlertTriangle size={48} strokeWidth={1} className="mx-auto mb-4 text-gray-300" />
          <h1 className="font-serif text-2xl mb-4">Please Sign In</h1>
          <p className="text-gray-500 text-sm mb-6">You need to be signed in to complete your purchase.</p>
          <Link to="/login" className="inline-block px-8 py-3 bg-black text-white text-xs tracking-[0.15em] font-semibold">
            SIGN IN
          </Link>
        </div>
      </main>
    );
  }

  if (items.length === 0 && !showSuccess) {
    return (
      <main className="min-h-screen pt-24 flex items-center justify-center bg-white">
        <div className="text-center">
          <h1 className="font-serif text-2xl mb-4">Your cart is empty</h1>
          <Link to="/shop" className="text-xs tracking-[0.15em] underline">BACK TO SHOP</Link>
        </div>
      </main>
    );
  }

  const selectedAddress = addresses.find((a) => a.id === selectedAddressId);

  const handleAddNewAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddr.fullName || !newAddr.phone || !newAddr.street || !newAddr.city || !newAddr.state) {
      showToast('Please fill in all address fields', 'error');
      return;
    }
    const actor = { id: user?.id ?? 'guest', name: user?.name ?? 'Customer', role: 'system' as const };
    const added = addAddress(newAddr, actor);
    setSelectedAddressId(added.id);
    setShowNewAddress(false);
    showToast('Address added', 'success');
    setNewAddr((p) => ({ ...p, street: '', city: '', state: '', isDefault: false }));
  };

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAddress) {
      showToast('Please add a delivery address', 'error');
      return;
    }
    setIsSubmitting(true);
    // Mock: in production this opens the Paystack inline iframe via
    // PaystackPop.setup({ key, email, amount, ref, callback, onClose }).
    // On success the backend webhook marks the order `received`.
    await new Promise((r) => setTimeout(r, 1500));

    const orderId = `ORD-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`;
    const customerEmail = user?.email ?? 'guest@havanat.store';
    const customerName = user?.name ?? selectedAddress.fullName;
    const customerPhone = user?.phone ?? selectedAddress.phone;
    const tier = user?.membershipTier ?? 'standard';
    const sub = cartSubtotal();
    const tDisc = tierDiscount(tier);
    const delFee = deliveryFee(zoneFeeByState ?? {});
    const tot = cartTotal(tier, zoneFeeByState);
    createOrder({
      id: orderId,
      customerId: user?.id ?? 'guest',
      customerName,
      customerEmail,
      customerPhone,
      items: items.map((it) => ({
        productId: it.product.id, name: it.product.name, image: it.product.images[0],
        size: it.size, quantity: it.quantity, price: it.product.price,
      })),
      subtotal: sub,
      tierDiscount: tDisc,
      deliveryFee: delFee,
      total: tot,
      shippingAddress: {
        street: selectedAddress.street,
        city: selectedAddress.city,
        state: selectedAddress.state,
      },
      status: 'received',
      paymentMethod: 'paystack',
    });
    broadcast(
      {
        title: `Order ${orderId} received`,
        body: `Thanks ${customerName.split(' ')[0]} — we've received your order and it's being prepared. We'll email you as soon as a rider is on the way.`,
        category: 'order',
        channels: 'both',
        scope: 'user',
        targetUserId: user?.id ?? customerEmail,
      },
      { id: 'system', name: 'Havanat', role: 'system' }
    );
    setIsSubmitting(false);
    setShowSuccess(true);
    clearCart();
    showToast('Payment successful — order placed!', 'success');
  };

  if (showSuccess) {
    return (
      <main className="min-h-screen pt-24 flex items-center justify-center bg-white px-4">
        <div className="text-center max-w-lg">
          <CheckCircle size={64} strokeWidth={1} className="mx-auto mb-6 text-black" />
          <h1 className="font-serif text-3xl sm:text-4xl mb-4">Order Confirmed</h1>
          <p className="text-gray-500 mb-2">Thank you for your purchase!</p>
          <p className="text-gray-400 text-sm mb-8">
            Your payment was successful. We'll email you the moment a rider picks up your order.
          </p>
          <div className="bg-gray-50 p-6 mb-8 text-left">
            <p className="text-xs tracking-[0.1em] text-gray-400 mb-2">DELIVERING TO</p>
            <p className="font-medium text-sm">
              {selectedAddress?.fullName} · {selectedAddress?.phone}
            </p>
            <p className="text-sm text-gray-600">
              {selectedAddress?.street}, {selectedAddress?.city}, {selectedAddress?.state}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/account" className="px-8 py-3 bg-black text-white text-xs tracking-[0.15em] font-semibold">
              VIEW ORDERS
            </Link>
            <Link to="/shop" className="px-8 py-3 border text-xs tracking-[0.15em] font-semibold">
              CONTINUE SHOPPING
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const inputClass = 'w-full px-3 py-2.5 text-sm border border-gray-200 focus:border-black focus:outline-none bg-white';

  return (
    <main className="min-h-screen pt-20 lg:pt-24 bg-white">
      <div className="px-4 sm:px-6 lg:px-12 py-8 lg:py-12 max-w-6xl mx-auto">
        <h1 className="font-serif text-3xl sm:text-4xl mb-8 lg:mb-12">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
          {/* Form */}
          <div className="lg:col-span-2 space-y-8">
            {/* Saved address selector */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xs tracking-[0.15em] font-semibold uppercase">Delivery Address</h2>
                {!showNewAddress && (
                  <button
                    type="button"
                    onClick={() => setShowNewAddress(true)}
                    className="text-[10px] uppercase tracking-[0.15em] text-gray-600 hover:text-black flex items-center gap-1"
                  >
                    <Plus size={12} /> Add new
                  </button>
                )}
              </div>

              {!showNewAddress && addresses.length === 0 && (
                <div className="border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
                  You don't have any saved addresses yet. Add one to continue.
                </div>
              )}

              {!showNewAddress && addresses.length > 0 && (
                <div className="space-y-2">
                  {addresses.map((a) => {
                    const selected = a.id === selectedAddressId;
                    return (
                      <label
                        key={a.id}
                        className={`flex items-start gap-3 p-4 border cursor-pointer transition-colors ${
                          selected ? 'border-black bg-gray-50' : 'border-gray-200 hover:border-gray-400'
                        }`}
                      >
                        <input
                          type="radio"
                          name="address"
                          checked={selected}
                          onChange={() => setSelectedAddressId(a.id)}
                          className="mt-1 w-4 h-4 accent-black flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="text-[10px] uppercase tracking-[0.2em] font-semibold bg-black text-white px-2 py-0.5">
                              {a.label}
                            </span>
                            {a.isDefault && (
                              <span className="text-[10px] uppercase tracking-[0.2em] text-gray-500">Default</span>
                            )}
                          </div>
                          <p className="text-sm font-medium">{a.fullName} · {a.phone}</p>
                          <p className="text-sm text-gray-600">
                            {a.street}, {a.city}, {a.state}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => { e.preventDefault(); navigate('/account/addresses'); }}
                          className="text-gray-400 hover:text-black flex-shrink-0"
                          aria-label="Edit addresses"
                        >
                          <Edit3 size={14} />
                        </button>
                      </label>
                    );
                  })}
                </div>
              )}

              {showNewAddress && (
                <form onSubmit={handleAddNewAddress} className="border border-gray-200 p-4 space-y-3 bg-gray-50">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] tracking-[0.1em] text-gray-400 mb-1 uppercase">Label</label>
                      <select
                        value={newAddr.label}
                        onChange={(e) => setNewAddr({ ...newAddr, label: e.target.value })}
                        className={inputClass}
                      >
                        <option>Home</option>
                        <option>Office</option>
                        <option>Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] tracking-[0.1em] text-gray-400 mb-1 uppercase">Full name *</label>
                      <input value={newAddr.fullName} onChange={(e) => setNewAddr({ ...newAddr, fullName: e.target.value })} className={inputClass} required />
                    </div>
                    <div>
                      <label className="block text-[10px] tracking-[0.1em] text-gray-400 mb-1 uppercase">Phone *</label>
                      <input type="tel" value={newAddr.phone} onChange={(e) => setNewAddr({ ...newAddr, phone: e.target.value })} className={inputClass} required />
                    </div>
                    <div>
                      <label className="block text-[10px] tracking-[0.1em] text-gray-400 mb-1 uppercase">State *</label>
                      <select value={newAddr.state} onChange={(e) => setNewAddr({ ...newAddr, state: e.target.value })} className={inputClass} required>
                        <option value="">Select state</option>
                        {NIGERIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] tracking-[0.1em] text-gray-400 mb-1 uppercase">Street *</label>
                      <input value={newAddr.street} onChange={(e) => setNewAddr({ ...newAddr, street: e.target.value })} className={inputClass} required />
                    </div>
                    <div>
                      <label className="block text-[10px] tracking-[0.1em] text-gray-400 mb-1 uppercase">City *</label>
                      <input value={newAddr.city} onChange={(e) => setNewAddr({ ...newAddr, city: e.target.value })} className={inputClass} required />
                    </div>
                    <div className="flex items-end">
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={newAddr.isDefault}
                          onChange={(e) => setNewAddr({ ...newAddr, isDefault: e.target.checked })}
                          className="w-4 h-4 accent-black"
                        />
                        Set as default
                      </label>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" className="px-5 py-2.5 bg-black text-white text-[10px] uppercase tracking-[0.15em] font-medium">
                      Save address
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowNewAddress(false)}
                      className="px-5 py-2.5 border text-[10px] uppercase tracking-[0.15em] font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </section>

            {/* Items in order */}
            <section>
              <h2 className="text-xs tracking-[0.15em] font-semibold uppercase mb-4">Order</h2>
              <ul className="divide-y divide-gray-200 border border-gray-200">
                {items.map((it) => (
                  <li key={`${it.product.id}-${it.size}`} className="flex items-center gap-4 p-4">
                    <div className="w-16 h-20 bg-gray-100 flex-shrink-0 overflow-hidden">
                      <img src={it.product.images[0]} alt={it.product.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{it.product.name}</p>
                      <p className="text-xs text-gray-500">Size {it.size} · Qty {it.quantity}</p>
                    </div>
                    <p className="text-sm font-medium flex-shrink-0">{formatNaira(it.product.price * it.quantity)}</p>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          {/* Order summary */}
          <aside className="lg:col-span-1">
            <div className="border border-gray-200 p-5 lg:p-6 bg-white lg:sticky lg:top-24">
              <p className="text-xs tracking-[0.15em] font-semibold uppercase mb-4">Summary</p>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-500">Subtotal</dt>
                  <dd>{formatNaira(cartSubtotal())}</dd>
                </div>
                {tierDiscount(user?.membershipTier) > 0 && (
                  <div className="flex justify-between text-green-700">
                    <dt>Tier discount ({user?.membershipTier})</dt>
                    <dd>-{formatNaira(tierDiscount(user?.membershipTier))}</dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-gray-500">Delivery to {selectedAddress?.state ?? '—'}</dt>
                  <dd>{formatNaira(deliveryFee(zoneFeeByState))}</dd>
                </div>
                <div className="flex justify-between pt-3 border-t border-gray-200 mt-3 font-semibold">
                  <dt>Total</dt>
                  <dd>{formatNaira(cartTotal(user?.membershipTier, zoneFeeByState))}</dd>
                </div>
              </dl>
              <button
                type="button"
                onClick={handlePay}
                disabled={isSubmitting || !selectedAddress}
                className="w-full mt-6 py-4 bg-black text-white text-xs tracking-[0.2em] font-semibold hover:bg-gray-900 transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? 'Processing payment…' : 'PAY NOW'}
              </button>
              <p className="text-[10px] text-gray-400 text-center mt-3 leading-relaxed">
                You will be redirected to Paystack to complete your payment securely. Your order will be confirmed once payment is received.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}