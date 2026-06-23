interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  destructive?: boolean;
}

export default function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  destructive,
}: ConfirmDialogProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => onOpenChange(false)}>
      <div
        className="bg-white border border-gray-200 max-w-md w-full p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-serif text-xl font-light mb-2">{title}</h3>
        <p className="text-sm text-gray-600 mb-6 leading-relaxed">{description}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={() => onOpenChange(false)}
            className="px-5 py-2.5 text-xs uppercase tracking-[0.15em] border border-gray-300 hover:border-black transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
            className={`px-5 py-2.5 text-xs uppercase tracking-[0.15em] font-medium transition-colors ${
              destructive ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-black text-white hover:bg-gray-900'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
