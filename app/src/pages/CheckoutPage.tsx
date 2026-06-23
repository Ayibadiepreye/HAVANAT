import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, CreditCard, Landmark, Truck, AlertTriangle } from 'lucide-react';
import { useCartStore } from '@/stores/useCartStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { useUIStore } from '@/stores/useUIStore';
import { formatNaira } from '@/config';

type PaymentMethod = 'card' | 'transfer' | 'pod';

export default function CheckoutPage() {
  const { items, subtotal, deliveryFee, total, clearCart } = useCartStore();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const showToast = useUIStore((s) => s.showToast);

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
  });
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Redirect if not authenticated
  if (!isAuthenticated) {
    return (
      <main className="min-h-screen pt-24 flex items-center justify-center bg-white px-4">
        <div className="text-center max-w-md">
          <AlertTriangle size={48} strokeWidth={1} className="mx-auto mb-4 text-gray-300" />
          <h1 className="font-serif text-2xl mb-4">Please Sign In</h1>
          <p className="text-gray-500 text-sm mb-6">You need to be signed in to complete your purchase.</p>
          <Link
            to="/login"
            className="inline-block px-8 py-3 bg-black text-white text-xs tracking-[0.15em] font-semibold"
          >
            SIGN IN
          </Link>
        </div>
      </main>
    );
  }

  // Redirect if cart is empty
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Mock order processing
    await new Promise((r) => setTimeout(r, 2000));
    setIsSubmitting(false);
    setShowSuccess(true);
    clearCart();
    showToast('Order placed successfully!', 'success');
  };

  if (showSuccess) {
    return (
      <main className="min-h-screen pt-24 flex items-center justify-center bg-white px-4">
        <div className="text-center max-w-lg">
          <CheckCircle size={64} strokeWidth={1} className="mx-auto mb-6 text-black" />
          <h1 className="font-serif text-3xl sm:text-4xl mb-4">Order Confirmed</h1>
          <p className="text-gray-500 mb-2">Thank you for your purchase!</p>
          <p className="text-gray-400 text-sm mb-8">
            Your order has been received and is being processed. You will receive a confirmation email shortly.
          </p>
          <div className="bg-gray-50 p-6 mb-8 text-left">
            <p className="text-xs tracking-[0.1em] text-gray-400 mb-2">ORDER NUMBER</p>
            <p className="font-medium text-lg">ORD-{Date.now().toString().slice(-6)}</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/account"
              className="px-8 py-3 bg-black text-white text-xs tracking-[0.15em] font-semibold"
            >
              VIEW ORDERS
            </Link>
            <Link
              to="/shop"
              className="px-8 py-3 border text-xs tracking-[0.15em] font-semibold"
            >
              CONTINUE SHOPPING
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const inputClass = "w-full px-4 py-3 border text-sm focus:outline-none focus:border-black transition-colors bg-white";

  return (
    <main className="min-h-screen pt-20 lg:pt-24 bg-white">
      <div className="px-4 sm:px-6 lg:px-12 py-8 lg:py-12">
        <h1 className="font-serif text-3xl sm:text-4xl mb-8 lg:mb-12">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-16">
          {/* Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Shipping */}
              <div>
                <h2 className="text-xs tracking-[0.15em] font-semibold uppercase mb-6">Shipping Address</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] tracking-[0.1em] text-gray-400 mb-2 uppercase">Full Name</label>
                    <input
                      type="text"
                      required
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className={inputClass}
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] tracking-[0.1em] text-gray-400 mb-2 uppercase">Phone Number</label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className={inputClass}
                      placeholder="+234 800 000 0000"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] tracking-[0.1em] text-gray-400 mb-2 uppercase">Email</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className={inputClass}
                      placeholder="your@email.com"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] tracking-[0.1em] text-gray-400 mb-2 uppercase">Street Address</label>
                    <input
                      type="text"
                      required
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className={inputClass}
                      placeholder="House number, street name"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] tracking-[0.1em] text-gray-400 mb-2 uppercase">City</label>
                    <input
                      type="text"
                      required
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className={inputClass}
                      placeholder="e.g., Victoria Island"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] tracking-[0.1em] text-gray-400 mb-2 uppercase">State</label>
                    <select
                      required
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      className={inputClass}
                    >
                      <option value="">Select State</option>
                      {['Lagos', 'Abuja', 'Rivers', 'Oyo', 'Kano', 'Delta', 'Kaduna', 'Ogun', 'Edo', 'Anambra'].map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <h2 className="text-xs tracking-[0.15em] font-semibold uppercase mb-6">Payment Method</h2>
                <div className="space-y-3">
                  {[
                    { key: 'card' as PaymentMethod, label: 'Debit / Credit Card', icon: CreditCard },
                    { key: 'transfer' as PaymentMethod, label: 'Bank Transfer', icon: Landmark },
                    { key: 'pod' as PaymentMethod, label: 'Pay on Delivery', icon: Truck, disabled: true },
                  ].map(({ key, label, icon: Icon, disabled }) => (
                    <label
                      key={key}
                      className={`flex items-center gap-4 p-4 border cursor-pointer transition-colors ${
                        disabled ? 'opacity-40 cursor-not-allowed' : paymentMethod === key ? 'border-black bg-gray-50' : 'hover:border-gray-400'
                      }`}
                    >
                      <input
                        type="radio"
                        name="payment"
                        value={key}
                        checked={paymentMethod === key}
                        onChange={() => !disabled && setPaymentMethod(key)}
                        disabled={disabled}
                        className="w-4 h-4 accent-black"
                      />
                      <Icon size={18} strokeWidth={1.5} />
                      <div>
                        <span className="text-sm font-medium">{label}</span>
                        {disabled && <p className="text-[10px] text-gray-400">Currently unavailable</p>}
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-black text-white text-xs tracking-[0.15em] font-semibold hover:bg-black/80 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'PROCESSING...' : `PLACE ORDER — ${formatNaira(total())}`}
              </button>
            </form>
          </div>

          {/* Order Summary */}
          <div className="lg:sticky lg:top-24 h-fit">
            <div className="border p-6">
              <h2 className="text-xs tracking-[0.15em] font-semibold mb-6 uppercase">Order Summary</h2>
              <div className="space-y-4 mb-6 max-h-60 overflow-y-auto">
                {items.map((item) => (
                  <div key={`${item.product.id}-${item.size}`} className="flex gap-3">
                    <div className="w-14 h-18 bg-gray-100 flex-shrink-0 overflow-hidden">
                      <img src={item.product.images[0]} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm truncate">{item.product.name}</p>
                      <p className="text-xs text-gray-400">Size: {item.size} x {item.quantity}</p>
                      <p className="text-sm font-medium">{formatNaira(item.product.price * item.quantity)}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="space-y-3 text-sm pt-4 border-t">
                <div className="flex justify-between">
                  <span className="text-gray-500">Subtotal</span>
                  <span>{formatNaira(subtotal())}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Delivery</span>
                  <span>{deliveryFee() === 0 ? 'Free' : formatNaira(deliveryFee())}</span>
                </div>
                <div className="flex justify-between font-semibold text-base pt-3 border-t">
                  <span>Total</span>
                  <span>{formatNaira(total())}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
