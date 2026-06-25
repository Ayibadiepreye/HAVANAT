import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Package, Crown, MapPin, Heart, LogOut } from 'lucide-react';
import { useUIStore } from '@/stores/useUIStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { useProductStore } from '@/stores/useProductStore';
import { MOCK_ORDERS, ADDRESSES, PRODUCTS } from '@/data/mockData';
import { formatNaira } from '@/config';
import MembershipPanel from '@/components/MembershipPanel';

type Tab = 'orders' | 'membership' | 'addresses' | 'wishlist';

const TABS: { key: Tab; label: string; icon: typeof Package }[] = [
  { key: 'orders', label: 'Orders', icon: Package },
  { key: 'membership', label: 'Membership', icon: Crown },
  { key: 'addresses', label: 'Addresses', icon: MapPin },
  { key: 'wishlist', label: 'Wishlist', icon: Heart },
];

const STATUS_COLORS: Record<string, string> = {
  received: 'bg-gray-100 text-gray-700',
  processing: 'bg-blue-100 text-blue-700',
  in_transit: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

export default function AccountPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('orders');
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const wishlist = useProductStore((s) => s.wishlist);
  const showToast = useUIStore((s) => s.showToast);

  const handleSignOut = () => {
    logout();
    showToast('Signed out — see you soon', 'success');
    navigate('/', { replace: true });
  };

  if (!user) {
    return (
      <main className="min-h-screen pt-24 flex items-center justify-center bg-white">
        <div className="text-center">
          <h1 className="font-serif text-2xl mb-4">Please Sign In</h1>
          <Link to="/login" className="text-xs tracking-[0.15em] underline">GO TO LOGIN</Link>
        </div>
      </main>
    );
  }

  const wishlistProducts = PRODUCTS.filter((p) => wishlist.includes(p.id));

  return (
    <main className="min-h-screen pt-20 lg:pt-24 pb-24 lg:pb-12 bg-white">
      <div className="px-4 sm:px-6 lg:px-12 py-8 lg:py-12">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8 lg:mb-12">
          <div className="w-14 h-14 bg-black text-white flex items-center justify-center font-serif text-xl">
            {user.name.charAt(0)}
          </div>
          <div>
            <h1 className="font-serif text-2xl">{user.name}</h1>
            <p className="text-sm text-gray-400">{user.email}</p>
            <div className="flex items-center gap-1 mt-1">
              <Crown size={12} className="text-gray-400" />
              <span className="text-[10px] tracking-[0.1em] text-gray-400 uppercase">{user.membershipTier} Member</span>
            </div>
            <Link to="/profile" className="inline-block mt-2 text-[10px] tracking-[0.15em] uppercase text-gray-500 hover:text-black underline">
              Profile settings →
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Desktop sidebar */}
          <aside className="hidden lg:block lg:col-span-1">
            <div className="lg:sticky lg:top-24 space-y-1">
              {TABS.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                    activeTab === key ? 'bg-black text-white' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon size={16} strokeWidth={1.5} />
                  {label}
                </button>
              ))}
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-500 hover:bg-red-50 transition-colors"
              >
                <LogOut size={16} strokeWidth={1.5} />
                Sign Out
              </button>
            </div>
          </aside>

          {/* Content */}
          <div className="lg:col-span-3">
            {/* Orders Tab */}
            {activeTab === 'orders' && (
              <div>
                <h2 className="text-xs tracking-[0.15em] font-semibold uppercase mb-6">Order History</h2>
                {MOCK_ORDERS.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <Package size={48} strokeWidth={1} className="mx-auto mb-4" />
                    <p>No orders yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {MOCK_ORDERS.map((order) => (
                      <div key={order.id} className="border p-5">
                        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                          <div>
                            <p className="text-xs text-gray-400">{order.id}</p>
                            <p className="text-xs text-gray-400">{new Date(order.date).toLocaleDateString('en-NG', { dateStyle: 'medium' })}</p>
                          </div>
                          <span className={`px-3 py-1 text-[10px] tracking-[0.1em] uppercase font-medium ${STATUS_COLORS[order.status]}`}>
                            {order.status}
                          </span>
                        </div>
                        <div className="space-y-2">
                          {order.items.map((item, i) => (
                            <div key={i} className="flex items-center gap-3">
                              <div className="w-12 h-16 bg-gray-100 overflow-hidden">
                                <img src={item.product.images[0]} alt="" className="w-full h-full object-cover" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm truncate">{item.product.name}</p>
                                <p className="text-xs text-gray-400">Size: {item.size} x {item.quantity}</p>
                              </div>
                              <span className="text-sm font-medium">{formatNaira(item.product.price * item.quantity)}</span>
                            </div>
                          ))}
                        </div>
                        <div className="flex items-center justify-between mt-4 pt-4 border-t">
                          <span className="text-sm font-semibold">Total: {formatNaira(order.total)}</span>
                          <button
                            onClick={() => {
                              useUIStore.getState().showToast('Return request initiated', 'info');
                              useUIStore.getState().openModal('return');
                            }}
                            className="text-xs tracking-[0.1em] text-gray-400 hover:text-black transition-colors"
                          >
                            RETURN ITEMS
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Membership Tab */}
            {activeTab === 'membership' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xs tracking-[0.15em] font-semibold uppercase mb-1">My Membership</h2>
                  <p className="text-sm text-gray-500">Subscription-based. Downgrades take effect at the end of the current billing period.</p>
                </div>
                <MembershipPanel />
              </div>
            )}

            {/* Addresses Tab */}
            {activeTab === 'addresses' && (
              <div>
                <h2 className="text-xs tracking-[0.15em] font-semibold uppercase mb-6">Saved Addresses</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {ADDRESSES.map((addr) => (
                    <div key={addr.id} className={`border p-5 ${addr.isDefault ? 'border-black' : ''}`}>
                      {addr.isDefault && (
                        <span className="text-[10px] tracking-[0.1em] text-gray-400 uppercase mb-3 block">Default</span>
                      )}
                      <p className="font-medium">{addr.name}</p>
                      <p className="text-sm text-gray-500 mt-1">{addr.street}</p>
                      <p className="text-sm text-gray-500">{addr.city}, {addr.state}</p>
                      <p className="text-sm text-gray-500 mt-1">{addr.phone}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Wishlist Tab */}
            {activeTab === 'wishlist' && (
              <div>
                <h2 className="text-xs tracking-[0.15em] font-semibold uppercase mb-6">My Wishlist</h2>
                {wishlistProducts.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <Heart size={48} strokeWidth={1} className="mx-auto mb-4" />
                    <p>Your wishlist is empty</p>
                    <Link to="/shop" className="text-xs tracking-[0.1em] underline mt-4 inline-block">BROWSE PRODUCTS</Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                    {wishlistProducts.map((product) => (
                      <Link key={product.id} to={`/shop/${product.slug}`} className="group">
                        <div className="aspect-[3/4] overflow-hidden bg-gray-100 img-zoom">
                          <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="mt-3">
                          <h3 className="text-sm font-medium truncate">{product.name}</h3>
                          <p className="text-sm font-semibold">{formatNaira(product.price)}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}

            </div>
        </div>
      </div>

      {/* Mobile bottom tab bar — sleek separate navigation for account sub-pages */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200">
        <div className="grid grid-cols-5">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex flex-col items-center gap-1 py-3 transition-colors ${
                activeTab === key ? 'text-black' : 'text-gray-400 hover:text-gray-600'
              }`}
              aria-label={label}
            >
              <Icon size={18} strokeWidth={activeTab === key ? 2 : 1.5} />
              <span className="text-[9px] uppercase tracking-[0.1em] font-medium">{label}</span>
            </button>
          ))}
        </div>
      </nav>
    </main>
  );
}
