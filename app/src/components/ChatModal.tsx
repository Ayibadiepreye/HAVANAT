import { useState } from 'react';
import { X, Send, Paperclip, CheckCircle } from 'lucide-react';
import { useUIStore } from '@/stores/useUIStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { Link } from 'react-router-dom';
import { apiPost } from '@/lib/api';

export default function ChatModal() {
  const activeModal = useUIStore((s) => s.activeModal);
  const closeModal = useUIStore((s) => s.closeModal);
  const showToast = useUIStore((s) => s.showToast);
  const user = useAuthStore((s) => s.user);

  const [occasion, setOccasion] = useState('');
  const [budget, setBudget] = useState('');
  const [timeline, setTimeline] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const isOpen = activeModal === 'chat';
  if (!isOpen) return null;

  const isElite = user?.membershipTier === 'elite';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || description.trim().length < 10) {
      showToast('Please provide at least 10 characters describing your custom piece', 'error');
      return;
    }
    if (!occasion.trim()) {
      showToast('Please specify the occasion', 'error');
      return;
    }

    setSubmitting(true);
    try {
      let imageUrl: string | undefined = undefined;
      
      // Upload image if provided
      if (file) {
        try {
          const reader = new FileReader();
          const base64 = await new Promise<string>((resolve, reject) => {
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });

          const uploadRes = await apiPost<{ url: string }>(
            '/api/uploads',
            { file: base64, filename: file.name, contentType: file.type },
            true
          );
          imageUrl = uploadRes.url;
        } catch (uploadErr: any) {
          showToast('Failed to upload image. Continuing without image.', 'info');
        }
      }

      // Submit bespoke request
      await apiPost(
        '/api/bespoke',
        {
          customerName: user?.name || 'Anonymous',
          customerEmail: user?.email || 'anonymous@example.com',
          customerPhone: user?.phone || '',
          occasion: occasion.trim(),
          budget: budget ? parseFloat(budget) : undefined,
          timeline: timeline.trim(),
          description: description.trim(),
          images: imageUrl ? [imageUrl] : [],
        },
        true
      );

      setSubmitted(true);
      showToast('Your bespoke request has been submitted successfully', 'success');
      
      setTimeout(() => {
        closeModal();
        setSubmitted(false);
        setOccasion('');
        setBudget('');
        setTimeline('');
        setDescription('');
        setFile(null);
      }, 2000);
    } catch (err: any) {
      showToast(err?.message || 'Failed to submit bespoke request', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeModal} />
      <div className="relative bg-white w-full max-w-lg max-h-[85vh] flex flex-col animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b flex-shrink-0">
          <div>
            <h3 className="font-serif text-xl">Bespoke Request</h3>
            <p className="text-xs text-gray-500 mt-1 tracking-wide">Custom tailoring consultation</p>
          </div>
          <button onClick={closeModal} className="p-1 hover:opacity-60">
            <X size={18} />
          </button>
        </div>

        {!isElite && !user ? (
          <div className="p-8 text-center overflow-y-auto">
            <p className="text-gray-600 mb-6">Please sign in to access bespoke customization services.</p>
            <Link
              to="/login"
              onClick={closeModal}
              className="inline-block px-8 py-3 bg-black text-white text-xs tracking-[0.15em] font-semibold"
            >
              SIGN IN
            </Link>
          </div>
        ) : !isElite ? (
          <div className="p-8 text-center overflow-y-auto">
            <p className="text-gray-600 mb-2">Bespoke customization is exclusive to Elite members.</p>
            <p className="text-sm text-gray-400 mb-6">Upgrade your membership to unlock this feature.</p>
            <Link
              to="/membership"
              onClick={closeModal}
              className="inline-block px-8 py-3 bg-black text-white text-xs tracking-[0.15em] font-semibold"
            >
              VIEW MEMBERSHIPS
            </Link>
          </div>
        ) : submitted ? (
          <div className="p-12 text-center overflow-y-auto">
            <CheckCircle size={48} className="mx-auto mb-4 text-black" strokeWidth={1} />
            <h4 className="font-serif text-lg mb-2">Request Submitted</h4>
            <p className="text-sm text-gray-500">Our team will contact you within 24 hours.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
            <div className="flex-1 p-6 overflow-y-auto space-y-4">
              {/* Occasion */}
              <div>
                <label className="block text-[10px] tracking-[0.1em] text-gray-400 mb-1.5 uppercase font-semibold">Occasion *</label>
                <input
                  type="text"
                  value={occasion}
                  onChange={(e) => setOccasion(e.target.value)}
                  placeholder="e.g., Wedding, Business Meeting, Gala Event"
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 focus:border-black focus:outline-none"
                  required
                />
              </div>

              {/* Budget */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] tracking-[0.1em] text-gray-400 mb-1.5 uppercase font-semibold">Budget (₦)</label>
                  <input
                    type="number"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    placeholder="150000"
                    min="0"
                    step="1000"
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 focus:border-black focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] tracking-[0.1em] text-gray-400 mb-1.5 uppercase font-semibold">Timeline</label>
                  <input
                    type="text"
                    value={timeline}
                    onChange={(e) => setTimeline(e.target.value)}
                    placeholder="e.g., 2 weeks"
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 focus:border-black focus:outline-none"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-[10px] tracking-[0.1em] text-gray-400 mb-1.5 uppercase font-semibold">Description *</label>
                <p className="text-xs text-gray-500 mb-2">
                  Describe your custom piece. Include fabric preferences, measurements, and any design details.
                </p>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="I would like a custom oversized blazer in midnight blue wool..."
                  className="w-full h-32 p-3 border border-gray-200 text-sm resize-none focus:outline-none focus:border-black transition-colors"
                  required
                  minLength={10}
                />
                <p className="text-xs text-gray-400 mt-1">Minimum 10 characters</p>
              </div>

              {/* File Upload */}
              <div>
                <label className="flex items-center gap-2 px-4 py-3 border border-dashed cursor-pointer hover:border-black transition-colors">
                  <Paperclip size={16} strokeWidth={1.5} />
                  <span className="text-sm text-gray-500">
                    {file ? file.name : 'Attach reference images (optional)'}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                  />
                </label>
              </div>

              {user && (
                <div className="mt-4 text-xs text-gray-400">
                  <p>From: {user.name} ({user.email})</p>
                </div>
              )}
            </div>
            <div className="p-6 border-t flex-shrink-0">
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-black text-white text-xs tracking-[0.15em] font-semibold flex items-center justify-center gap-2 hover:bg-black/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send size={14} />
                {submitting ? 'SUBMITTING...' : 'SEND REQUEST'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
