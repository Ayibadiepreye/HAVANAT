import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { useUIStore } from '@/stores/useUIStore';

export default function ToastContainer() {
  const toasts = useUIStore((s) => s.toasts);
  const dismiss = useUIStore((s) => s.dismissToast);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[80] space-y-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-center gap-3 px-4 py-3 text-white text-sm animate-in slide-in-from-bottom-2 fade-in duration-300 ${
            toast.type === 'success' ? 'bg-black' : toast.type === 'error' ? 'bg-red-600' : 'bg-gray-800'
          }`}
        >
          {toast.type === 'success' && <CheckCircle size={16} />}
          {toast.type === 'error' && <AlertCircle size={16} />}
          {toast.type === 'info' && <Info size={16} />}
          <span>{toast.message}</span>
          <button onClick={() => dismiss(toast.id)} className="ml-2 hover:opacity-70">
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
