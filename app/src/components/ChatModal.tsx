import { useState } from 'react';
import { X, Send, Paperclip, CheckCircle } from 'lucide-react';
import { useUIStore } from '@/stores/useUIStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { Link } from 'react-router-dom';

export default function ChatModal() {
  const activeModal = useUIStore((s) => s.activeModal);
  const closeModal = useUIStore((s) => s.closeModal);
  const showToast = useUIStore((s) => s.showToast);
  const user = useAuthStore((s) => s.user);

  const [message, setMessage] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const isOpen = activeModal === 'chat';
  if (!isOpen) return null;

  const isElite = user?.membershipTier === 'elite';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setSubmitted(true);
    showToast('Your bespoke request has been submitted', 'success');
    setTimeout(() => {
      closeModal();
      setSubmitted(false);
      setMessage('');
      setFile(null);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeModal} />
      <div className="relative bg-white w-full max-w-lg max-h-[85vh] overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h3 className="font-serif text-xl">Bespoke Request</h3>
            <p className="text-xs text-gray-500 mt-1 tracking-wide">Custom tailoring consultation</p>
          </div>
          <button onClick={closeModal} className="p-1 hover:opacity-60">
            <X size={18} />
          </button>
        </div>

        {!isElite && !user ? (
          <div className="p-8 text-center">
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
          <div className="p-8 text-center">
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
          <div className="p-12 text-center">
            <CheckCircle size={48} className="mx-auto mb-4 text-black" strokeWidth={1} />
            <h4 className="font-serif text-lg mb-2">Request Submitted</h4>
            <p className="text-sm text-gray-500">Our team will contact you within 24 hours.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col h-full">
            <div className="flex-1 p-6 overflow-y-auto min-h-[200px]">
              <p className="text-sm text-gray-600 mb-4">
                Describe your custom piece. Include fabric preferences, measurements, and any design details.
              </p>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="I would like a custom oversized blazer in midnight blue wool..."
                className="w-full h-32 p-4 border text-sm resize-none focus:outline-none focus:border-black transition-colors"
                required
              />
              {/* File Upload */}
              <div className="mt-4">
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
            <div className="p-6 border-t">
              <button
                type="submit"
                className="w-full py-3 bg-black text-white text-xs tracking-[0.15em] font-semibold flex items-center justify-center gap-2 hover:bg-black/80 transition-colors"
              >
                <Send size={14} />
                SEND REQUEST
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
