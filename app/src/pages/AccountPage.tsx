import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Package, Crown, MapPin, Heart, LogOut, Plus, Edit3, Trash2 } from 'lucide-react';
import MobileBottomNav, { type MobileBottomNavItem } from '@/components/MobileBottomNav';
import { useUIStore } from '@/stores/useUIStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { useProductStore } from '@/stores/useProductStore';
import { useOrderStore } from '@/stores/useOrderStore';
import { useAddressStore, type Address as StoreAddress } from '@/stores/useAddressStore';
import { NIGERIAN_STATES } from '@/pages/CheckoutPage';
import { formatNaira } from '@/config';
import MembershipPanel from '@/components/MembershipPanel';
import EmailVerificationBanner from '@/components/EmailVerificationBanner';

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
  const [searchParams] = useSearchParams();
  const validTabs: Tab[] = ['orders', 'membership', 'addresses', 'wishlist'];
  const initialTab = (searchParams.get('tab') ?? 'orders') as Tab;
  const [activeTab, setActiveTab] = useState<Tab>(validTabs.includes(initialTab) ? initialTab : 'orders');
  const addresses = useAddressStore((s) => s.addresses);
  const addAddress = useAddressStore((s) => s.addAddress);
  const updateAddress = useAddressStore((s) => s.updateAddress);
  const removeAddress = useAddressStore((s) => s.removeAddress);
  const setDefaultAddress = useAddressStore((s) => s.setDefault);
  const fetchAddresses = useAddressStore((s) => s.fetchAddresses);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [editingAddr, setEditingAddr] = useState<StoreAddress | null>(null);
  const [showAddrForm, setShowAddrForm] = useState(false);
  const [removingAddr, setRemovingAddr] = useState<StoreAddress | null>(null);
  const [addrForm, setAddrForm] = useState<Omit<StoreAddress, 'id'>>({
    label: 'Home', fullName: '', phone: '', email: '', street: '', city: '', state: '', isDefault: false,
  });

  const handleAddrSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const actor = { id: user!.id, name: user!.name, role: 'system' as const };
    if (editingAddr) {
      await updateAddress(editingAddr.id, addrForm, actor);
      showToast('Address updated', 'success');
    } else {
      await addAddress(addrForm, actor);
      showToast('Address added', 'success');
    }
    setShowAddrForm(false);
    setEditingAddr(null);
  };

  const handleRemoveAddr = async () => {
    if (!removingAddr) return;
    const actor = { id: user!.id, name: user!.name, role: 'system' as const };
    await removeAddress(removingAddr.id, actor);
    showToast('Address removed', 'success');
    setRemovingAddr(null);
  };

  const inputClass = 'w-full px-3 py-2.5 text-sm border border-gray-200 focus:border-black focus:outline-none bg-white';
  const navItems: MobileBottomNavItem[] = [
    { key: 'orders', label: 'Orders', icon: Package, onClick: () => setActiveTab('orders') },
    { key: 'membership', label: 'Membership', icon: Crown, onClick: () => setActiveTab('membership') },
    { key: 'addresses', label: 'Addresses', icon: MapPin, onClick: () => setActiveTab('addresses') },
    { key: 'wishlist', label: 'Wishlist', icon: Heart, onClick: () => setActiveTab('wishlist') },
  ];
  const user = useAuthStore((s) => s.user);

  // Fetch addresses when authenticated
  useEffect(() => {
    if (isAuthenticated) fetchAddresses();
  }, [isAuthenticated, fetchAddresses]);

  // Reset form when opening
  useEffect(() => {
    if (showAddrForm && !editingAddr) {
      setAddrForm({
        label: 'Home',
        fullName: user!.name ?? '',
        phone: user!.phone ?? '',
        email: user!.email ?? '',
        street: '',
        city: '',
        state: '',
        isDefault: addresses.length === 0,
      });
    } else if (editingAddr) {
      const { id: _ignore, ...rest } = editingAddr;
      setAddrForm(rest);
    }
  }, [showAddrForm, editingAddr, user!.name, user!.phone, user!.email, addresses.length]);

  // Fetch addresses when authenticated
  useEffect(() => {
    if (isAuthenticated) fetchAddresses();
  }, [isAuthenticated, fetchAddresses]);

  // Reset form when opening
  useEffect(() => {
    if (showAddrForm && !editingAddr) {
      setAddrForm({
        label: 'Home',
        fullName: user?.name ?? '',
        phone: user?.phone ?? '',
        email: user?.email ?? '',
        street: '',
        city: '',
        state: '',
        isDefault: addresses.length === 0,
      });
    } else if (editingAddr) {
      const { id: _ignore, ...rest } = editingAddr;
      setAddrForm(rest);
    }
  }, [showAddrForm, editingAddr, user?.name, user?.phone, user?.email, addresses.length]);
  const logout = useAuthStore((s) => s.logout);
  const wishlist = useProductStore((s) => s.wishlist);
  const products = useProductStore((s) => s.products);
  const fetchProducts = useProductStore((s) => s.fetchProducts);
  const orders = useOrderStore((s) => s.orders);
  const fetchOrders = useOrderStore((s) => s.fetchOrders);
  useEffect(() => { if (products.length === 0) fetchProducts(); if (orders.length === 0) fetchOrders(); }, [products.length, orders.length, fetchProducts, fetchOrders]);
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

  const wishlistProducts = products.filter((p) => wishlist.includes(p.id));

  return (
    <>
    <EmailVerificationBanner />
    <main className="min-h-screen pt-20 lg:pt-24 pb-24 lg:pb-12 bg-white">
        <div className="lg:hidden h-0" />
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
                {orders.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <Package size={48} strokeWidth={1} className="mx-auto mb-4" />
                    <p>No orders yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order: any) => (
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
                          {(order.items ?? []).map((item: any, i: number) => (
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
                <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                  <h2 className="text-xs tracking-[0.15em] font-semibold uppercase">Saved Addresses</h2>
                  {!showAddrForm && (
                    <button
                      onClick={() => { setEditingAddr(null); setShowAddrForm(true); }}
                      className="px-4 py-2 bg-black text-white text-[10px] uppercase tracking-[0.15em] font-medium flex items-center gap-2"
                    >
                      <Plus className="h-3.5 w-3.5" /> Add new address
                    </button>
                  )}
                </div>

                {showAddrForm && (
                  <form onSubmit={handleAddrSubmit} className="border border-gray-200 p-5 sm:p-6 mb-6">
                    <h3 className="font-serif text-xl mb-4">{editingAddr ? 'Edit Address' : 'New Address'}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-[10px] uppercase tracking-[0.1em] text-gray-500 mb-1">Label</label>
                        <select value={addrForm.label} onChange={(e) => setAddrForm({ ...addrForm, label: e.target.value })} className={inputClass}>
                          <option>Home</option>
                          <option>Office</option>
                          <option>Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase tracking-[0.1em] text-gray-500 mb-1">Full name *</label>
                        <input value={addrForm.fullName} onChange={(e) => setAddrForm({ ...addrForm, fullName: e.target.value })} className={inputClass} required />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase tracking-[0.1em] text-gray-500 mb-1">Phone *</label>
                        <input type="tel" value={addrForm.phone} onChange={(e) => setAddrForm({ ...addrForm, phone: e.target.value })} className={inputClass} required />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase tracking-[0.1em] text-gray-500 mb-1">State *</label>
                        <select value={addrForm.state} onChange={(e) => setAddrForm({ ...addrForm, state: e.target.value })} className={inputClass} required>
                          <option value="">Select state</option>
                          {NIGERIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] uppercase tracking-[0.1em] text-gray-500 mb-1">Street *</label>
                        <input value={addrForm.street} onChange={(e) => setAddrForm({ ...addrForm, street: e.target.value })} className={inputClass} required />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase tracking-[0.1em] text-gray-500 mb-1">City *</label>
                        <input value={addrForm.city} onChange={(e) => setAddrForm({ ...addrForm, city: e.target.value })} className={inputClass} required />
                      </div>
                      <div className="flex items-end">
                        <label className="flex items-center gap-2 text-sm">
                          <input type="checkbox" checked={addrForm.isDefault} onChange={(e) => setAddrForm({ ...addrForm, isDefault: e.target.checked })} className="w-4 h-4 accent-black" />
                          Set as default
                        </label>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button type="submit" className="px-5 py-2.5 bg-black text-white text-[10px] uppercase tracking-[0.15em] font-medium">
                        {editingAddr ? 'Save changes' : 'Save address'}
                      </button>
                      <button
                        type="button"
                        onClick={() => { setShowAddrForm(false); setEditingAddr(null); }}
                        className="px-5 py-2.5 border text-[10px] uppercase tracking-[0.15em] font-medium"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}

                {addresses.length === 0 && !showAddrForm && (
                  <div className="border border-dashed border-gray-300 p-12 text-center">
                    <MapPin className="h-8 w-8 mx-auto mb-3 text-gray-300" />
                    <p className="text-sm text-gray-500 mb-4">No saved addresses yet.</p>
                    <button onClick={() => { setEditingAddr(null); setShowAddrForm(true); }} className="text-[10px] uppercase tracking-[0.15em] underline">Add Your First Address</button>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {addresses.map((a) => (
                    <div key={a.id} className={`border p-5 ${a.isDefault ? 'border-black' : 'border-gray-200'}`}>
                      <div className="flex items-start justify-between mb-2 gap-2 flex-wrap">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] uppercase tracking-[0.2em] font-semibold bg-black text-white px-2 py-0.5">
                            {a.label}
                          </span>
                          {a.isDefault && (
                            <span className="text-[10px] uppercase tracking-[0.2em] text-gray-500">Default</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <button onClick={() => { setEditingAddr(a); setShowAddrForm(true); }} className="p-1.5 text-gray-400 hover:text-black" aria-label="Edit">
                            <Edit3 size={14} />
                          </button>
                          <button onClick={() => setRemovingAddr(a)} className="p-1.5 text-gray-400 hover:text-red-600" aria-label="Delete">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                      <p className="text-sm font-medium">{a.fullName} · {a.phone}</p>
                      <p className="text-sm text-gray-600">{a.street}, {a.city}, {a.state}</p>
                      {!a.isDefault && (
                        <button
                          onClick={() => { setDefaultAddress(a.id); showToast('Default address updated', 'success'); }}
                          className="mt-3 text-[10px] uppercase tracking-[0.15em] underline text-gray-500 hover:text-black"
                        >
                          Set as default
                        </button>
                      )}
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

      <MobileBottomNav
        activeKey={activeTab}
        items={navItems}
      />
    </main>

    {/* Remove-address confirmation */}
    {removingAddr && (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white p-6 max-w-md w-full">
          <h3 className="font-serif text-xl mb-2">Delete address?</h3>
          <p className="text-sm text-gray-600 mb-5">
            This will remove <strong>{removingAddr.label}</strong> — {removingAddr.street}, {removingAddr.city}, {removingAddr.state}.
          </p>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setRemovingAddr(null)} className="px-4 py-2 border text-[10px] uppercase tracking-[0.15em]">Cancel</button>
            <button onClick={handleRemoveAddr} className="px-4 py-2 bg-red-600 text-white text-[10px] uppercase tracking-[0.15em]">
              Delete
            </button>
          </div>
        </div>
      </div>
    )}
  </>
)}
