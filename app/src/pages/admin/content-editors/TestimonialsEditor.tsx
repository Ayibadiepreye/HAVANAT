import { useState } from 'react';
import { useContentStore } from '@/stores/useContentStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { useUIStore } from '@/stores/useUIStore';
import AdminTable, { type Column } from '@/components/admin/AdminTable';
import { Plus, X, Star, Edit, Trash2 } from 'lucide-react';
import ImageUploader from '@/components/admin/ImageUploader';
import type { DashboardTestimonial } from '@/types/dashboard';

export default function TestimonialsEditor() {
  const testimonials = useContentStore((s) => s.testimonials);
  const addTestimonial = useContentStore((s) => s.addTestimonial);
  const updateTestimonial = useContentStore((s) => s.updateTestimonial);
  const removeTestimonial = useContentStore((s) => s.removeTestimonial);
  const dashboardUser = useAuthStore((s) => s.dashboardUser);
  const showToast = useUIStore((s) => s.showToast);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<DashboardTestimonial | null>(null);

  const columns: Column<DashboardTestimonial>[] = [
    { key: 'avatar', label: '', width: '50px', render: (t) => <img src={t.avatar} alt="" className="h-10 w-10 rounded-full object-cover bg-gray-100" /> },
    { key: 'name', label: 'Name', render: (t) => t.name },
    { key: 'rating', label: 'Rating', render: (t) => <div className="flex">{[1, 2, 3, 4, 5].map((n) => <Star key={n} className={`h-3.5 w-3.5 ${n <= t.rating ? 'fill-current text-black' : 'text-gray-300'}`} />)}</div> },
    { key: 'text', label: 'Text', render: (t) => <span className="line-clamp-1 text-xs">{t.text}</span> },
    { key: 'approved', label: 'Approved', render: (t) => t.approved ? <span className="text-green-700 text-xs">Yes</span> : <span className="text-gray-500 text-xs">No</span> },
    {
      key: 'actions', label: '', align: 'right', width: '100px',
      render: (t) => (
        <div className="flex justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button onClick={() => { setEditing(t); setShowForm(true); }} className="p-1.5 hover:bg-gray-100"><Edit className="h-4 w-4" /></button>
          <button
            onClick={() => {
              if (!dashboardUser) return;
              removeTestimonial(t.id, { id: dashboardUser.id, name: dashboardUser.name, role: 'admin' });
              showToast('Testimonial removed', 'success');
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
        <p className="text-sm text-gray-600">{testimonials.length} testimonials</p>
        <button onClick={() => { setEditing(null); setShowForm(true); }} className="bg-black text-white px-4 py-2 text-[10px] uppercase tracking-[0.2em] font-medium flex items-center gap-2">
          <Plus className="h-3.5 w-3.5" /> Add Testimonial
        </button>
      </div>

      <AdminTable<DashboardTestimonial>
        columns={columns}
        rows={testimonials}
        keyFn={(t) => t.id}
        emptyMessage="No testimonials yet"
      />

      {showForm && (
        <TestimonialFormModal
          testimonial={editing}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSubmit={(data) => {
            if (!dashboardUser) return;
            if (editing) {
              updateTestimonial(editing.id, data, { id: dashboardUser.id, name: dashboardUser.name, role: 'admin' });
              showToast('Testimonial updated', 'success');
            } else {
              addTestimonial(data, { id: dashboardUser.id, name: dashboardUser.name, role: 'admin' });
              showToast('Testimonial added', 'success');
            }
            setShowForm(false);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

function TestimonialFormModal({ testimonial, onClose, onSubmit }: { testimonial: DashboardTestimonial | null; onClose: () => void; onSubmit: (data: Omit<DashboardTestimonial, 'id'>) => void }) {
  const [form, setForm] = useState({
    name: testimonial?.name ?? '',
    avatar: testimonial?.avatar ?? '/images/community/professional-1.jpg',
    rating: testimonial?.rating ?? 5,
    text: testimonial?.text ?? '',
    date: testimonial?.date ?? new Date().toISOString().slice(0, 10),
    approved: testimonial?.approved ?? true,
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-serif text-xl font-light">{testimonial ? 'Edit' : 'Add'} Testimonial</h3>
          <button onClick={onClose} aria-label="Close"><X className="h-5 w-5" /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-[10px] uppercase tracking-[0.2em] text-gray-500 mb-1.5 font-medium">Name</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-gray-200 focus:border-black focus:outline-none" />
          </div>
          <div>
            <ImageUploader value={form.avatar ?? ''} onChange={(url) => setForm({ ...form, avatar: url })} folder="havanat/testimonials" label="Avatar" aspect="square" hint="Square crop ~400×400" />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-[0.2em] text-gray-500 mb-1.5 font-medium">Rating</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setForm({ ...form, rating: n })}
                  className={`p-1 ${n <= form.rating ? 'text-black' : 'text-gray-300'}`}
                >
                  <Star className={`h-5 w-5 ${n <= form.rating ? 'fill-current' : ''}`} />
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-[0.2em] text-gray-500 mb-1.5 font-medium">Text</label>
            <textarea value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} rows={3} className="w-full px-3 py-2.5 text-sm border border-gray-200 focus:border-black focus:outline-none resize-none" />
          </div>
          <div>
            <label className="flex items-center gap-2 text-xs">
              <input type="checkbox" checked={form.approved} onChange={(e) => setForm({ ...form, approved: e.target.checked })} />
              <span>Approved (visible on public site)</span>
            </label>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <button onClick={onClose} className="px-4 py-2 text-[10px] uppercase tracking-[0.15em] border border-gray-300 hover:border-black">Cancel</button>
          <button onClick={() => onSubmit(form)} disabled={!form.name || !form.text} className="px-4 py-2 text-[10px] uppercase tracking-[0.15em] bg-black text-white hover:bg-gray-900 disabled:opacity-50">Save</button>
        </div>
      </div>
    </div>
  );
}
