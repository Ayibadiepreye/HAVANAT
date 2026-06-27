import { useEffect, useState, useMemo } from 'react';
import { useContentStore } from '@/stores/useContentStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { useUIStore } from '@/stores/useUIStore';
import { Check, X, MessageSquare, Star } from 'lucide-react';
import { formatDate } from '@/utils/formatters';

export default function ModeratorTestimonials() {
  const testimonials = useContentStore((s) => s.testimonials);
  const fetchContent = useContentStore((s) => s.fetchContent);
  useEffect(() => { void fetchContent(); }, [fetchContent]);
  const approveTestimonial = useContentStore((s) => s.approveTestimonial);
  const removeTestimonial = useContentStore((s) => s.removeTestimonial);
  const dashboardUser = useAuthStore((s) => s.dashboardUser);
  const showToast = useUIStore((s) => s.showToast);
  const [tab, setTab] = useState<'pending' | 'approved' | 'all'>('pending');

  const filtered = useMemo(() => {
    if (tab === 'pending') return testimonials.filter((t) => !t.approved);
    if (tab === 'approved') return testimonials.filter((t) => t.approved);
    return testimonials;
  }, [testimonials, tab]);

  const pendingCount = testimonials.filter((t) => !t.approved).length;
  const approvedCount = testimonials.filter((t) => t.approved).length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-2xl sm:text-3xl font-light">Testimonial Moderation</h2>
        <p className="text-sm text-gray-500 mt-1">Approve customer testimonials before they appear on the public site. {pendingCount} pending review.</p>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {(['pending', 'approved', 'all'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-[10px] uppercase tracking-[0.2em] font-medium transition-colors ${
              tab === t ? 'bg-black text-white' : 'bg-white border border-gray-200 hover:border-black'
            }`}
          >
            {t} ({t === 'pending' ? pendingCount : t === 'approved' ? approvedCount : testimonials.length})
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white border border-gray-200 p-12 text-center">
          <MessageSquare className="h-6 w-6 mx-auto mb-2 text-gray-400" />
          <p className="text-sm text-gray-500">No testimonials in this view.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((t) => (
            <div key={t.id} className="bg-white border border-gray-200 p-5">
              <div className="flex items-start gap-4">
                <img src={t.avatar} alt="" className="h-12 w-12 rounded-full object-cover bg-gray-100 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-medium">{t.name}</span>
                    <div className="flex gap-0.5">
                      {Array.from({ length: t.rating }).map((_, i) => (
                        <Star key={i} className="h-3 w-3 fill-black text-black" />
                      ))}
                    </div>
                    <span className="text-[10px] uppercase tracking-wider text-gray-500 ml-auto">{formatDate(t.date)}</span>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed mb-3">&ldquo;{t.text}&rdquo;</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    {!t.approved ? (
                      <button
                        onClick={() => {
                          if (!dashboardUser) return;
                          approveTestimonial(t.id, true, { id: dashboardUser.id, name: dashboardUser.name, role: 'moderator' });
                          showToast(`Approved: ${t.name}`, 'success');
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-black text-white text-[10px] uppercase tracking-wider hover:bg-gray-900"
                      ><Check className="h-3 w-3" /> Approve</button>
                    ) : (
                      <button
                        onClick={() => {
                          if (!dashboardUser) return;
                          approveTestimonial(t.id, false, { id: dashboardUser.id, name: dashboardUser.name, role: 'moderator' });
                          showToast('Un-approved', 'info');
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 text-[10px] uppercase tracking-wider hover:border-black"
                      ><X className="h-3 w-3" /> Un-approve</button>
                    )}
                    <button
                      onClick={() => {
                        if (!dashboardUser) return;
                        if (!confirm(`Delete testimonial from ${t.name}?`)) return;
                        removeTestimonial(t.id, { id: dashboardUser.id, name: dashboardUser.name, role: 'moderator' });
                        showToast(`Deleted: ${t.name}`, 'success');
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-red-300 text-red-600 text-[10px] uppercase tracking-wider hover:bg-red-50"
                    ><X className="h-3 w-3" /> Delete</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}