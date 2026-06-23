import { useState } from 'react';
import { useRiderStore } from '@/stores/useRiderStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { useUIStore } from '@/stores/useUIStore';
import AdminTable, { type Column } from '@/components/admin/AdminTable';
import StatusBadge from '@/components/admin/StatusBadge';
import { Plus, X, Star, Eye, Mail } from 'lucide-react';
import { formatNaira } from '@/utils/formatters';
import type { Rider } from '@/types/dashboard';

export default function AdminRiders() {
  const riders = useRiderStore((s) => s.riders);
  const setStatus = useRiderStore((s) => s.setStatus);
  const dashboardUser = useAuthStore((s) => s.dashboardUser);
  const showToast = useUIStore((s) => s.showToast);
  const [details, setDetails] = useState<Rider | null>(null);
  const [showForm, setShowForm] = useState(false);

  const columns: Column<Rider>[] = [
    { key: 'name', label: 'Name', render: (r) => <div><p className="font-medium">{r.name}</p><p className="text-xs text-gray-500">{r.email}</p></div> },
    { key: 'phone', label: 'Phone', render: (r) => <span className="text-xs">{r.phone}</span> },
    { key: 'vehicle', label: 'Vehicle', render: (r) => <span className="text-xs">{r.vehicleType} · {r.plateNumber}</span> },
    { key: 'rating', label: 'Rating', render: (r) => <span className="flex items-center gap-1 text-xs"><Star className="h-3 w-3 fill-current" /> {r.rating}</span> },
    { key: 'deliveries', label: 'Deliveries', render: (r) => r.totalDeliveries, align: 'right' },
    { key: 'earnings', label: 'Earnings', render: (r) => formatNaira(r.totalEarnings), align: 'right' },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} type="rider" /> },
    {
      key: 'actions', label: '', align: 'right', width: '160px',
      render: (r) => (
        <div className="flex justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button onClick={() => setDetails(r)} className="p-1.5 hover:bg-gray-100"><Eye className="h-4 w-4" /></button>
          {r.status === 'active' ? (
            <button
              onClick={() => dashboardUser && setStatus(r.id, 'suspended', { id: dashboardUser.id, name: dashboardUser.name, role: 'admin' })}
              className="px-2 py-1 text-[9px] uppercase tracking-wider border border-red-200 text-red-700 hover:bg-red-50">Suspend</button>
          ) : (
            <button
              onClick={() => dashboardUser && setStatus(r.id, 'active', { id: dashboardUser.id, name: dashboardUser.name, role: 'admin' })}
              className="px-2 py-1 text-[9px] uppercase tracking-wider border border-green-200 text-green-700 hover:bg-green-50">Activate</button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="font-serif text-2xl sm:text-3xl font-light">Riders</h2>
          <p className="text-sm text-gray-500 mt-1">{riders.filter((r) => r.status === 'active').length} active riders</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-black text-white px-5 py-2.5 text-[10px] uppercase tracking-[0.2em] font-medium hover:bg-gray-900 transition-colors flex items-center gap-2"
        >
          <Plus className="h-3.5 w-3.5" /> Add Rider
        </button>
      </div>

      <AdminTable<Rider>
        columns={columns}
        rows={riders}
        keyFn={(r) => r.id}
        emptyMessage="No riders in the roster"
      />

      {details && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setDetails(null)}>
          <div className="bg-white max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="font-serif text-2xl font-light">{details.name}</h3>
              <button onClick={() => setDetails(null)} aria-label="Close" className="hover:opacity-70"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-6 space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Email" value={details.email} />
                <Field label="Phone" value={details.phone} />
                <Field label="Address" value={details.address} />
                <Field label="Vehicle" value={`${details.vehicleType} (${details.plateNumber})`} />
                <Field label="Rating" value={`${details.rating} ★`} />
                <Field label="Status" value={<StatusBadge status={details.status} type="rider" />} />
                <Field label="Total Deliveries" value={details.totalDeliveries} />
                <Field label="Total Earnings" value={formatNaira(details.totalEarnings)} />
              </div>
              <div className="bg-gray-50 p-3 text-sm">
                <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1 font-semibold">Bank Details</p>
                <p>{details.bank.bankName} · {details.bank.accountNumber} · {details.bank.accountName}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <AddRiderModal
          onClose={() => setShowForm(false)}
          onSubmit={(data) => {
            if (!dashboardUser) return;
            useRiderStore.getState().addRider(data, { id: dashboardUser.id, name: dashboardUser.name, role: 'admin' });
            showToast(`Rider ${data.name} added`, 'success');
            setShowForm(false);
          }}
        />
      )}
    </div>
  );
}

function AddRiderModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (rider: Omit<Rider, 'id' | 'rating' | 'totalDeliveries' | 'totalEarnings' | 'joinedAt'>) => void }) {
  const [form, setForm] = useState({
    name: '', email: '', phone: '', address: '',
    vehicleType: 'Bike' as Rider['vehicleType'], plateNumber: '',
    status: 'pending' as Rider['status'], idVerified: false,
    bank: { bankName: '', accountNumber: '', accountName: '' },
  });

  const isValid = form.name && form.phone && form.email && form.vehicleType && form.plateNumber;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="font-serif text-2xl font-light">Add Rider</h3>
          <button onClick={onClose} aria-label="Close" className="hover:opacity-70"><X className="h-5 w-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field1 label="Full Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
            <Field1 label="Email" value={form.email} type="email" onChange={(v) => setForm({ ...form, email: v })} />
            <Field1 label="Phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
            <Field1 label="Address" value={form.address} onChange={(v) => setForm({ ...form, address: v })} />
            <div>
              <label className="block text-[10px] uppercase tracking-[0.2em] text-gray-500 mb-1.5 font-medium">Vehicle Type</label>
              <select value={form.vehicleType} onChange={(e) => setForm({ ...form, vehicleType: e.target.value as Rider['vehicleType'] })} className="w-full px-3 py-2.5 text-sm border border-gray-200 focus:border-black focus:outline-none bg-white">
                <option>Bike</option><option>Car</option><option>Van</option>
              </select>
            </div>
            <Field1 label="Plate Number" value={form.plateNumber} onChange={(v) => setForm({ ...form, plateNumber: v })} />
          </div>

          <div className="border-t border-gray-200 pt-4">
            <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 mb-3 font-medium">Bank Details</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field1 label="Bank Name" value={form.bank.bankName} onChange={(v) => setForm({ ...form, bank: { ...form.bank, bankName: v } })} />
              <Field1 label="Account Number" value={form.bank.accountNumber} onChange={(v) => setForm({ ...form, bank: { ...form.bank, accountNumber: v } })} />
              <Field1 label="Account Name" value={form.bank.accountName} onChange={(v) => setForm({ ...form, bank: { ...form.bank, accountName: v } })} />
            </div>
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-[0.2em] text-gray-500 mb-1.5 font-medium">ID Verification</label>
            <div className="border-2 border-dashed border-gray-200 p-6 text-center text-sm text-gray-500">
              <Mail className="h-5 w-5 mx-auto mb-1 text-gray-400" /> Upload driver's license & ID (mock)
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 p-6 border-t border-gray-200">
          <button onClick={onClose} className="px-5 py-2.5 text-[10px] uppercase tracking-[0.2em] border border-gray-300 hover:border-black">Cancel</button>
          <button
            onClick={() => onSubmit({ ...form, status: 'pending', idVerified: false } as never)}
            disabled={!isValid}
            className="px-5 py-2.5 text-[10px] uppercase tracking-[0.2em] border border-gray-300 hover:border-black disabled:opacity-50"
          >Save as Draft</button>
          <button
            onClick={() => onSubmit({ ...form, status: 'active', idVerified: true } as never)}
            disabled={!isValid}
            className="px-5 py-2.5 text-[10px] uppercase tracking-[0.2em] font-medium bg-black text-white hover:bg-gray-900 disabled:opacity-50"
          >Verify & Add</button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 mb-1 font-medium">{label}</p>
      <div className="text-sm">{value}</div>
    </div>
  );
}

function Field1({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="block text-[10px] uppercase tracking-[0.2em] text-gray-500 mb-1.5 font-medium">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="w-full px-3 py-2.5 text-sm border border-gray-200 focus:border-black focus:outline-none" />
    </div>
  );
}
