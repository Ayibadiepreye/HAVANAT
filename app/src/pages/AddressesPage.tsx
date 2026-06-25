import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit3, Trash2, MapPin } from 'lucide-react';
import { useAddressStore, type Address } from '@/stores/useAddressStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { useUIStore } from '@/stores/useUIStore';
import { NIGERIAN_STATES } from '@/pages/CheckoutPage';

export default function AddressesPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const showToast = useUIStore((s) => s.showToast);
  const addresses = useAddressStore((s) => s.addresses);
  const addAddress = useAddressStore((s) => s.addAddress);
  const updateAddress = useAddressStore((s) => s.updateAddress);
  const removeAddress = useAddressStore((s) => s.removeAddress);
  const setDefault = useAddressStore((s) => s.setDefault);
  const fetchAddresses = useAddressStore((s) => s.fetchAddresses);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const [editing, setEditing] = useState<Address | null>(null);
  const [showForm, setShowForm] = useState(addresses.length === 0);
  const [removing, setRemoving] = useState<Address | null>(null);
  const [form, setForm] = useState<Omit<Address, 'id'>>({
    label: 'Home',
    fullName: user?.name ?? '',
    phone: user?.phone ?? '',
    email: user?.email ?? '',
    street: '',
    city: '',
    state: '',
    isDefault: false,
  });

  // Fetch real addresses from backend when authenticated
  useEffect(() => {
    if (isAuthenticated) fetchAddresses();
  }, [isAuthenticated, fetchAddresses]);

  // When opening the form for editing, prefill
  useEffect(() => {
    if (editing) {
      const { id: _ignore, ...rest } = editing;
      setForm(rest);
    }
  }, [editing]);

  const inputClass = 'w-full px-3 py-2.5 text-sm border border-gray-200 focus:border-black focus:outline-none bg-white';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const actor = { id: user?.id ?? 'guest', name: user?.name ?? 'Customer', role: 'system' as const };
    if (editing) {
      updateAddress(editing.id, form, actor);
      showToast('Address updated', 'success');
      setEditing(null);
    } else {
      addAddress(form, actor);
      showToast('Address added', 'success');
    }
    setShowForm(false);
    setForm({ label: 'Home', fullName: user?.name ?? '', phone: user?.phone ?? '', email: user?.email ?? '', street: '', city: '', state: '', isDefault: false });
  };

  const startAdd = () => {
    setEditing(null);
    setForm({ label: 'Home', fullName: user?.name ?? '', phone: user?.phone ?? '', email: user?.email ?? '', street: '', city: '', state: '', isDefault: addresses.length === 0 });
    setShowForm(true);
  };

  const startEdit = (a: Address) => {
    setEditing(a);
    setShowForm(true);
  };

  return (
    <main className="min-h-screen pt-20 lg:pt-24 bg-white">
      <div className="px-4 sm:px-6 lg:px-12 py-8 lg:py-12 max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
          <h1 className="font-serif text-3xl sm:text-4xl">Address Book</h1>
          {!showForm && (
            <button
              onClick={startAdd}
              className="px-5 py-2.5 bg-black text-white text-[10px] uppercase tracking-[0.15em] font-medium flex items-center gap-2"
            >
              <Plus className="h-3.5 w-3.5" /> Add New Address
            </button>
          )}
        </div>

        {addresses.length === 0 && !showForm && (
          <div className="border border-dashed border-gray-300 p-12 text-center">
            <MapPin className="h-8 w-8 mx-auto mb-3 text-gray-300" />
            <p className="text-sm text-gray-500 mb-4">No saved addresses yet.</p>
            <button onClick={startAdd} className="text-[10px] uppercase tracking-[0.15em] underline">Add Your First Address</button>
          </div>
        )}

        {showForm && (
          <form onSubmit={handleSubmit} className="border border-gray-200 p-5 sm:p-6 mb-6">
            <h2 className="font-serif text-xl mb-4">{editing ? 'Edit Address' : 'New Address'}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-[10px] uppercase tracking-[0.1em] text-gray-500 mb-1">Label</label>
                <select value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} className={inputClass}>
                  <option>Home</option>
                  <option>Office</option>
                  <option>Other</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-[0.1em] text-gray-500 mb-1">Full name *</label>
                <input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className={inputClass} required />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-[0.1em] text-gray-500 mb-1">Phone *</label>
                <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputClass} required />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-[0.1em] text-gray-500 mb-1">State *</label>
                <select value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} className={inputClass} required>
                  <option value="">Select state</option>
                  {NIGERIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[10px] uppercase tracking-[0.1em] text-gray-500 mb-1">Street *</label>
                <input value={form.street} onChange={(e) => setForm({ ...form, street: e.target.value })} className={inputClass} required />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-[0.1em] text-gray-500 mb-1">City *</label>
                <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className={inputClass} required />
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={form.isDefault} onChange={(e) => setForm({ ...form, isDefault: e.target.checked })} className="w-4 h-4 accent-black" />
                  Set as default
                </label>
              </div>
            </div>
            <div className="flex gap-2">
              <button type="submit" className="px-5 py-2.5 bg-black text-white text-[10px] uppercase tracking-[0.15em] font-medium">
                {editing ? 'Save changes' : 'Save address'}
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setEditing(null); }}
                className="px-5 py-2.5 border text-[10px] uppercase tracking-[0.15em] font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        <ul className="space-y-3">
          {addresses.map((a) => (
            <li key={a.id} className="border border-gray-200 p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3 mb-2 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] uppercase tracking-[0.2em] font-semibold bg-black text-white px-2 py-0.5">
                    {a.label}
                  </span>
                  {a.isDefault && (
                    <span className="text-[10px] uppercase tracking-[0.2em] text-gray-500">Default</span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => startEdit(a)} className="p-1.5 text-gray-400 hover:text-black" aria-label="Edit">
                    <Edit3 size={14} />
                  </button>
                  <button onClick={() => setRemoving(a)} className="p-1.5 text-gray-400 hover:text-red-600" aria-label="Delete">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <p className="text-sm font-medium">{a.fullName} · {a.phone}</p>
              <p className="text-sm text-gray-600">{a.street}, {a.city}, {a.state}</p>
              {!a.isDefault && (
                <button
                  onClick={() => { setDefault(a.id); showToast('Default address updated', 'success'); }}
                  className="mt-2 text-[10px] uppercase tracking-[0.15em] underline text-gray-500 hover:text-black"
                >
                  Set as default
                </button>
              )}
            </li>
          ))}
        </ul>

        {removing && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white p-6 max-w-md w-full">
              <h3 className="font-serif text-xl mb-2">Delete address?</h3>
              <p className="text-sm text-gray-600 mb-5">
                This will remove <strong>{removing.label}</strong> — {removing.street}, {removing.city}, {removing.state}.
              </p>
              <div className="flex gap-2 justify-end">
                <button onClick={() => setRemoving(null)} className="px-4 py-2 border text-[10px] uppercase tracking-[0.15em]">Cancel</button>
                <button
                  onClick={() => {
                    const actor = { id: user?.id ?? 'guest', name: user?.name ?? 'Customer', role: 'system' as const };
                    removeAddress(removing.id, actor);
                    showToast('Address removed', 'success');
                    setRemoving(null);
                  }}
                  className="px-4 py-2 bg-red-600 text-white text-[10px] uppercase tracking-[0.15em]"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 text-center">
          <button onClick={() => navigate('/account')} className="text-[10px] uppercase tracking-[0.2em] text-gray-500 hover:text-black underline">
            Back to account
          </button>
        </div>
      </div>
    </main>
  );
}