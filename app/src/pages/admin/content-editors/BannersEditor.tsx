import { useState } from 'react';
import { useContentStore } from '@/stores/useContentStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { useUIStore } from '@/stores/useUIStore';
import AdminTable, { type Column } from '@/components/admin/AdminTable';
import StatusBadge from '@/components/admin/StatusBadge';
import { Plus, X, Edit, Trash2 } from 'lucide-react';
import type { Banner } from '@/types/dashboard';

export default function BannersEditor() {
  const banners = useContentStore((s) => s.banners);
  const addBanner = useContentStore((s) => s.addBanner);
  const updateBanner = useContentStore((s) => s.updateBanner);
  const removeBanner = useContentStore((s) => s.removeBanner);
  const dashboardUser = useAuthStore((s) => s.dashboardUser);
  const showToast = useUIStore((s) => s.showToast);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Banner | null>(null);

  const columns: Column<Banner>[] = [
    { key: 'image', label: 'Image', width: '100px', render: (b) => <img src={b.image} className="h-10 w-20 object-cover bg-gray-100" alt="" /> },
    { key: 'title', label: 'Title', render: (b) => b.title },
    { key: 'link', label: 'Link', render: (b) => <span className="text-xs text-gray-500">{b.link}</span> },
    { key: 'dates', label: 'Start / End', render: (b) => <span className="text-xs">{b.startDate} → {b.endDate}</span> },
    { key: 'status', label: 'Status', render: (b) => <StatusBadge status={b.status} type="generic" /> },
    {
      key: 'actions', label: '', align: 'right', width: '100px',
      render: (b) => (
        <div className="flex justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button onClick={() => { setEditing(b); setShowForm(true); }} className="p-1.5 hover:bg-gray-100"><Edit className="h-4 w-4" /></button>
          <button
            onClick={() => {
              if (!dashboardUser) return;
              removeBanner(b.id, { id: dashboardUser.id, name: dashboardUser.name, role: 'admin' });
              showToast('Banner removed', 'success');
            }}
            className="p-1.5 hover:bg-gray-100 text-red-600"
          ><Trash2 className="h-4 w-4" /></button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-600">{banners.length} banners</p>
        <button onClick={() => { setEditing(null); setShowForm(true); }} className="bg-black text-white px-4 py-2 text-[10px] uppercase tracking-[0.2em] font-medium flex items-center gap-2">
          <Plus className="h-3.5 w-3.5" /> Add Banner
        </button>
      </div>

      <AdminTable<Banner>
        columns={columns}
        rows={banners}
        keyFn={(b) => b.id}
        emptyMessage="No banners"
      />

      {showForm && (
        <BannerFormModal
          banner={editing}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSubmit={(data) => {
            if (!dashboardUser) return;
            if (editing) {
              updateBanner(editing.id, data, { id: dashboardUser.id, name: dashboardUser.name, role: 'admin' });
              showToast('Banner updated', 'success');
            } else {
              addBanner(data, { id: dashboardUser.id, name: dashboardUser.name, role: 'admin' });
              showToast('Banner created', 'success');
            }
            setShowForm(false);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

function BannerFormModal({ banner, onClose, onSubmit }: { banner: Banner | null; onClose: () => void; onSubmit: (data: Omit<Banner, 'id'>) => void }) {
  const [form, setForm] = useState<Omit<Banner, 'id'>>(banner ?? {
    image: '/images/hero/fabric-hero.jpg',
    title: '',
    link: '/shop',
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
    status: 'scheduled',
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-serif text-xl font-light">{banner ? 'Edit' : 'Add'} Banner</h3>
          <button onClick={onClose} aria-label="Close"><X className="h-5 w-5" /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-[10px] uppercase tracking-[0.2em] text-gray-500 mb-1.5 font-medium">Image URL</label>
            <input value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-gray-200 focus:border-black focus:outline-none" />
            <img src={form.image} className="mt-2 h-32 w-full object-cover bg-gray-100" alt="" />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-[0.2em] text-gray-500 mb-1.5 font-medium">Title</label>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-gray-200 focus:border-black focus:outline-none" />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-[0.2em] text-gray-500 mb-1.5 font-medium">Link</label>
            <input value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-gray-200 focus:border-black focus:outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] uppercase tracking-[0.2em] text-gray-500 mb-1.5 font-medium">Start Date</label>
              <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-gray-200 focus:border-black focus:outline-none" />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-[0.2em] text-gray-500 mb-1.5 font-medium">End Date</label>
              <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-gray-200 focus:border-black focus:outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-[0.2em] text-gray-500 mb-1.5 font-medium">Status</label>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Banner['status'] })} className="w-full px-3 py-2.5 text-sm border border-gray-200 focus:border-black focus:outline-none bg-white">
              <option value="scheduled">Scheduled</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <button onClick={onClose} className="px-4 py-2 text-[10px] uppercase tracking-[0.15em] border border-gray-300 hover:border-black">Cancel</button>
          <button onClick={() => onSubmit(form)} disabled={!form.title} className="px-4 py-2 text-[10px] uppercase tracking-[0.15em] bg-black text-white hover:bg-gray-900 disabled:opacity-50">Save</button>
        </div>
      </div>
    </div>
  );
}
