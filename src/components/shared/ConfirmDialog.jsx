import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, X } from 'lucide-react';

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Konfirmasi Hapus',
  message = 'Apakah Anda yakin ingin menghapus item ini?',
  confirmText = 'Hapus',
  variant = 'danger', // 'danger' | 'warning'
}) {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  const iconBg = variant === 'danger' ? 'bg-red-50' : 'bg-amber-50';
  const iconColor = variant === 'danger' ? 'text-red-500' : 'text-amber-500';
  const btnBg = variant === 'danger'
    ? 'bg-red-600 hover:bg-red-700 focus:ring-red-400'
    : 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-400';

  return createPortal(
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        style={{ animation: 'fadeInBg 0.2s ease-out forwards' }}
      />

      {/* Dialog */}
      <div
        className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl"
        style={{ animation: 'scaleIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1 text-gray-300 hover:text-gray-500 hover:bg-warm-100 rounded-lg transition-all duration-200"
        >
          <X size={16} />
        </button>

        {/* Content */}
        <div className="px-6 pt-6 pb-2 text-center">
          <div className={`w-14 h-14 ${iconBg} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
            <AlertTriangle size={28} className={iconColor} />
          </div>
          <h3 className="text-base font-semibold text-gray-800 mb-1.5">{title}</h3>
          <p className="text-sm text-gray-500 leading-relaxed">{message}</p>
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 pt-4 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 bg-warm-100 hover:bg-warm-200 rounded-xl transition-all duration-200"
          >
            Batal
          </button>
          <button
            onClick={() => { onConfirm(); onClose(); }}
            className={`flex-1 px-4 py-2.5 text-sm font-semibold text-white ${btnBg} rounded-xl transition-all duration-200 shadow-sm hover:shadow focus:outline-none focus:ring-2 focus:ring-offset-1`}
          >
            {confirmText}
          </button>
        </div>
      </div>

      {/* Scoped keyframes */}
      <style>{`
        @keyframes fadeInBg {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.92) translateY(8px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>,
    document.body
  );
}
