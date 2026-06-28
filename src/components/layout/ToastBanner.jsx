import { useApp } from '../../context/AppContext';
import { WifiOff, X, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ToastBanner() {
  const { apiConnected, toast, showToast } = useApp();

  return (
    <>
      {/* Connection banner — shown when backend is disconnected */}
      {apiConnected === false && (
        <div className="fixed top-0 left-0 right-0 z-[200] bg-red-600 text-white px-4 py-2.5 flex items-center justify-center gap-2 text-sm font-medium shadow-lg">
          <WifiOff size={16} className="shrink-0" />
          <span>
            Backend tidak terhubung — data tidak akan tersimpan. Jalankan server:{' '}
            <code className="bg-red-700/50 px-1.5 py-0.5 rounded text-xs font-mono">cd server && npm run dev</code>
          </span>
        </div>
      )}

      {/* Toast notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[200] max-w-sm animate-slide-up">
          <div className={`flex items-start gap-3 px-4 py-3 rounded-xl shadow-xl border ${
            toast.type === 'error'
              ? 'bg-white border-red-200 text-red-800'
              : 'bg-white border-emerald-200 text-emerald-800'
          }`}>
            {toast.type === 'error'
              ? <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
              : <CheckCircle2 size={18} className="text-emerald-500 shrink-0 mt-0.5" />
            }
            <p className="text-sm leading-snug flex-1">{toast.message}</p>
            <button
              onClick={() => showToast(null, null)}
              className="p-0.5 text-gray-400 hover:text-gray-600 shrink-0"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
