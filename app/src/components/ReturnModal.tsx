import { useState } from 'react';
import { X, CheckCircle } from 'lucide-react';
import { useUIStore } from '@/stores/useUIStore';

export default function ReturnModal() {
  const activeModal = useUIStore((s) => s.activeModal);
  const closeModal = useUIStore((s) => s.closeModal);
  const showToast = useUIStore((s) => s.showToast);

  const [step, setStep] = useState<'form' | 'success'>('form');
  const [orderId, setOrderId] = useState('');
  const [reason, setReason] = useState('');

  const isOpen = activeModal === 'return';
  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep('success');
    showToast('Return request submitted successfully', 'success');
    setTimeout(() => {
      closeModal();
      setStep('form');
      setOrderId('');
      setReason('');
    }, 2500);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeModal} />
      <div className="relative bg-white w-full max-w-md animate-in zoom-in-95 duration-300">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="font-serif text-xl">Initiate Return</h3>
          <button onClick={closeModal} className="p-1 hover:opacity-60">
            <X size={18} />
          </button>
        </div>

        {step === 'success' ? (
          <div className="p-12 text-center">
            <CheckCircle size={48} className="mx-auto mb-4 text-black" strokeWidth={1} />
            <h4 className="font-serif text-lg mb-2">Return Initiated</h4>
            <p className="text-sm text-gray-500">Check your email for return instructions.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-xs tracking-[0.1em] font-medium mb-2">ORDER ID</label>
              <input
                type="text"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                placeholder="e.g., ORD-2026-001"
                className="w-full px-4 py-3 border text-sm focus:outline-none focus:border-black transition-colors"
                required
              />
            </div>
            <div>
              <label className="block text-xs tracking-[0.1em] font-medium mb-2">REASON FOR RETURN</label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-4 py-3 border text-sm focus:outline-none focus:border-black transition-colors bg-white"
                required
              >
                <option value="">Select a reason</option>
                <option value="wrong-size">Wrong Size</option>
                <option value="defective">Defective/Damaged</option>
                <option value="not-as-described">Not As Described</option>
                <option value="changed-mind">Changed My Mind</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs tracking-[0.1em] font-medium mb-2">ADDITIONAL NOTES</label>
              <textarea
                className="w-full px-4 py-3 border text-sm resize-none h-24 focus:outline-none focus:border-black transition-colors"
                placeholder="Optional details..."
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 bg-black text-white text-xs tracking-[0.15em] font-semibold hover:bg-black/80 transition-colors"
            >
              SUBMIT RETURN REQUEST
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
