import { useState } from 'react';
import { Plus, Edit, Trash2, MapPin, Star, X } from 'lucide-react';
import { useUIStore } from '@/stores/useUIStore';

interface Address {
  id: string;
  label: string;
  street: string;
  city: string;
  state: string;
  phone: string;
  isDefault: boolean;
}

const SEED: Address[] = [
  { id: 'a1', label: 'Home', street: '24 Adetokunbo Ademola', city: 'Lagos', state: 'Lagos', phone: '+234 803 000 0000', isDefault: true },
  { id: 'a2', label: 'Office', street: '1B Bishop Aboyade Cole', city: 'Lagos', state: 'Lagos', phone: '+234 803 000 0000', isDefault: false },
];

export default function AddressesPage() {
  const showToast = useUIStore((s) => s.showToast);
  const [addresses, setAddresses] = useState<Address[]>(SEED);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Address | null>(null);
  const [removing, setRemoving] = useState<Address | null>(null);

  return (
    <main className="min-h-screen pt-20 lg:pt-24 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
          <div>
            <p className="text-[10px] tracking-[0.25em] text-gray-400 uppercase mb-2">My Account</p>
            <h1 className="font-serif text-3xl sm:text-4xl">Address Book</h1>
            <p className="text-sm text-gray-500 mt-1">{addresses.length} saved address{addresses.length !== 1 && 'es'}</p>
          </div>
          <button
            onClick={() => { setEditing(null); setShowForm(true); }}
            className="bg-black text-white px-5 py-2.5 text-[10px] uppercase tracking-[0.2em] font-medium hover:bg-gray-900 flex items-center gap-2"
          >
            <Plus className="h-3.5 w-3.5" /> Add New Address
          </button>
        </div>

        {addresses.length === 0 ? (
          <div className="bg-white border border-gray-200 p-12 text-center">
            <MapPin className="h-8 w-8 mx-auto mb-3 text-gray-400" />
            <p className="text-sm text-gray-500 mb-4">You haven't saved any addresses yet.</p>
            <button onClick={() => setShowForm(true)} className="bg-black text-white px-5 py-2 text-[10px] uppercase tracking-[0.2em] hover:bg-gray-900">
              Add Your First Address
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {addresses.map((a) => (
              <div key={a.id} className="bg-white border border-gray-200 p-5 hover:border-black transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{a.label}</span>
                    {a.isDefault && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-black text-white text-[9px] uppercase tracking-wider">
                        <Star className="h-2.5 w-2.5 fill-white" /> Default
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-sm text-gray-700 leading-relaxed mb-4">
                  <p>{a.street}</p>
                  <p>{a.city}, {a.state}</p>
                  <p className="text-gray-500 mt-1">{a.phone}</p>
                </div>
                <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                  {!a.isDefault && (
                    <button
                      onClick={() => {
                        setAddresses(addresses.map((x) => ({ ...x, isDefault: x.id === a.id })));
                        showToast('Default address updated', 'success');
                      }}
                      className="text-xs uppercase tracking-wider text-gray-600 hover:text-black"
                    >
                      Set Default
                    </button>
                  )}
                  <button
                    onClick={() => { setEditing(a); setShowForm(true); }}
                    className="text-xs uppercase tracking-wider text-gray-600 hover:text-black ml-auto flex items-center gap-1"
                  ><Edit className="h-3 w-3" /> Edit</button>
                  <button
                    onClick={() => setRemoving(a)}
                    className="text-xs uppercase tracking-wider text-red-600 hover:text-red-700 flex items-center gap-1"
                  ><Trash2 className="h-3 w-3" /> Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {showForm && (
          <AddressFormModal
            address={editing}
            onClose={() => { setShowForm(false); setEditing(null); }}
            onSave={(data) => {
              if (editing) {
                setAddresses(addresses.map((x) => (x.id === editing.id ? { ...x, ...data } : x)));
                showToast('Address updated', 'success');
              } else {
                setAddresses([...addresses, { id: `a${Date.now()}`, isDefault: addresses.length === 0, ...data }]);
                showToast('Address added', 'success');
              }
              setShowForm(false);
              setEditing(null);
            }}
          />
        )}

        {removing && (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setRemoving(null)}>
            <div className="bg-white max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
              <h3 className="font-serif text-xl font-light mb-2">Delete this address?</h3>
              <p className="text-sm text-gray-600 mb-6">{removing.label} — {removing.street}, {removing.city}</p>
              <div className="flex justify-end gap-3">
                <button onClick={() => setRemoving(null)} className="px-5 py-2.5 text-xs uppercase tracking-[0.15em] border border-gray-300 hover:border-black">Cancel</button>
                <button
                  onClick={() => {
                    setAddresses(addresses.filter((x) => x.id !== removing.id));
                    showToast('Address deleted', 'success');
                    setRemoving(null);
                  }}
                  className="px-5 py-2.5 text-xs uppercase tracking-[0.15em] font-medium bg-red-600 text-white hover:bg-red-700"
                >Delete</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function AddressFormModal({ address, onClose, onSave }: { address: Address | null; onClose: () => void; onSave: (a: Omit<Address, 'id' | 'isDefault'>) => void }) {
  const [form, setForm] = useState({
    label: address?.label ?? '',
    street: address?.street ?? '',
    city: address?.city ?? '',
    state: address?.state ?? '',
    phone: address?.phone ?? '',
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white max-w-lg w-full p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-serif text-xl font-light">{address ? 'Edit Address' : 'Add Address'}</h3>
          <button onClick={onClose}><X className="h-5 w-5" /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-[10px] uppercase tracking-[0.2em] text-gray-500 mb-1.5 font-medium">Label</label>
            <input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="Home, Office, ..." className="w-full px-3 py-2.5 text-sm border border-gray-200 focus:border-black focus:outline-none" />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-[0.2em] text-gray-500 mb-1.5 font-medium">Street</label>
            <input value={form.street} onChange={(e) => setForm({ ...form, street: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-gray-200 focus:border-black focus:outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] uppercase tracking-[0.2em] text-gray-500 mb-1.5 font-medium">City</label>
              <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-gray-200 focus:border-black focus:outline-none" />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-[0.2em] text-gray-500 mb-1.5 font-medium">State</label>
              <input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-gray-200 focus:border-black focus:outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-[0.2em] text-gray-500 mb-1.5 font-medium">Phone</label>
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-gray-200 focus:border-black focus:outline-none" />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <button onClick={onClose} className="px-5 py-2.5 text-xs uppercase tracking-[0.15em] border border-gray-300 hover:border-black">Cancel</button>
          <button
            onClick={() => onSave(form)}
            disabled={!form.street || !form.city}
            className="px-5 py-2.5 text-xs uppercase tracking-[0.15em] font-medium bg-black text-white hover:bg-gray-900 disabled:opacity-50"
          >Save</button>
        </div>
      </div>
    </div>
  );
}