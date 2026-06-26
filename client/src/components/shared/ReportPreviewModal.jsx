import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Printer, FileText, GraduationCap, ChevronDown, ChevronUp, Maximize2, Minimize2 } from 'lucide-react';
import { useState, useRef } from 'react';

export default function ReportPreviewModal({ isOpen, onClose, student, totalPages, onPrint, children }) {
  const [scale, setScale] = useState(0.7);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      // Auto-fit scale based on viewport width
      const vw = window.innerWidth;
      // A4 is ~794px wide. Leave some padding.
      const idealScale = Math.min(0.85, (vw - 80) / 794);
      setScale(Math.max(0.4, idealScale));
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // Keyboard: Escape to close
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  // Reset scroll on open
  useEffect(() => {
    if (isOpen && scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [isOpen]);

  if (!isOpen || !student) return null;

  const handleZoomIn = () => setScale(s => Math.min(1.2, s + 0.1));
  const handleZoomOut = () => setScale(s => Math.max(0.3, s - 0.1));
  const handleFitWidth = () => {
    const vw = window.innerWidth;
    setScale(Math.max(0.4, Math.min(0.85, (vw - 80) / 794)));
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex flex-col bg-gray-900/80 backdrop-blur-sm print-modal"
      style={{ animation: 'fadeIn 0.25s ease-out forwards' }}>

      {/* ── Toolbar ── */}
      <div className="relative z-10 bg-white border-b border-warm-200 shadow-lg print-toolbar">
        <div className="flex items-center justify-between px-5 py-3">
          {/* Left: Student info */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex items-center justify-center w-10 h-10 bg-primary-600 text-white rounded-xl font-bold text-base shrink-0">
              {student.name.charAt(0)}
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-gray-800 truncate">{student.name}</h2>
              <p className="text-xs text-gray-400">
                NISN: {student.nis} &middot; Kelas: {student.class} &middot; {totalPages} halaman
              </p>
            </div>
          </div>

          {/* Center: Zoom controls */}
          <div className="hidden sm:flex items-center gap-1 bg-warm-100 rounded-lg px-1 py-0.5">
            <button onClick={handleZoomOut}
              className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-warm-200 rounded transition-all"
              title="Zoom Out">
              <ChevronDown size={14} />
            </button>
            <span className="text-xs font-medium text-gray-600 w-12 text-center">{Math.round(scale * 100)}%</span>
            <button onClick={handleZoomIn}
              className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-warm-200 rounded transition-all"
              title="Zoom In">
              <ChevronUp size={14} />
            </button>
            <div className="w-px h-4 bg-warm-300 mx-0.5" />
            <button onClick={handleFitWidth}
              className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-warm-200 rounded transition-all"
              title="Fit Width">
              <Maximize2 size={13} />
            </button>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onPrint}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-all duration-200 shadow-sm"
            >
              <Printer size={15} />
              <span className="hidden sm:inline">Print / Save PDF</span>
              <span className="sm:hidden">Print</span>
            </button>
            <button onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-warm-100 rounded-lg transition-all duration-200"
              title="Tutup (Esc)">
              <X size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Preview area ── */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-auto print-scroll"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <div
          className="py-8 flex flex-col items-center print-preview"
          style={{
            transform: `scale(${scale})`,
            transformOrigin: 'top center',
            minWidth: '794px', // prevent reflow
          }}
        >
          {children}
        </div>
      </div>

      {/* ── Bottom status bar ── */}
      <div className="relative z-10 bg-white/90 backdrop-blur border-t border-warm-200 px-5 py-2 flex items-center justify-between text-xs text-gray-400 print-status">
        <div className="flex items-center gap-2">
          <GraduationCap size={13} />
          <span>MYP Report Card Preview</span>
        </div>
        <div className="flex items-center gap-3">
          <span>Zoom: {Math.round(scale * 100)}%</span>
          <span>Pages: {totalPages}</span>
          <span className="hidden sm:inline text-gray-300">Tekan Esc untuk menutup</span>
        </div>
      </div>
    </div>,
    document.body
  );
}
