import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Printer, Download, GraduationCap, ChevronDown, ChevronUp, Maximize2, Loader2, CheckCircle2 } from 'lucide-react';
import { downloadReportAsPdf } from '../../utils/pdfDownloader';

export default function ReportPreviewModal({ isOpen, onClose, student, totalPages, onPrint, autoDownload = false, children }) {
  const [scale, setScale] = useState(0.7);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(null);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const scrollRef = useRef(null);
  const reportContentRef = useRef(null);

  const cleanClass = (student?.class || '').trim();
  const cleanName = (student?.name || '').trim();
  const rawTitle = cleanClass ? `${cleanClass}_${cleanName}` : cleanName;
  const pdfTitle = rawTitle.replace(/[/\\?%*:|"<>]/g, '_').trim() || 'Rapor_Siswa';

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      // Auto-fit scale based on viewport width
      const vw = window.innerWidth;
      // A4 is ~794px wide. Leave some padding.
      const idealScale = Math.min(0.85, (vw - 80) / 794);
      setScale(Math.max(0.4, idealScale));
      setDownloadSuccess(false);
    } else {
      document.body.style.overflow = '';
      setIsDownloading(false);
      setDownloadProgress(null);
      setDownloadSuccess(false);
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // Set document title dynamically
  useEffect(() => {
    if (isOpen && student) {
      const prevTitle = 'MTs-MILBoS-MYP Report';
      document.title = pdfTitle;
      const titleEl = document.querySelector('title');
      if (titleEl) titleEl.textContent = pdfTitle;

      return () => {
        document.title = prevTitle;
        if (titleEl) titleEl.textContent = prevTitle;
      };
    }
  }, [isOpen, student, pdfTitle]);

  // Keyboard: Escape to close
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (e.key === 'Escape' && !isDownloading) onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose, isDownloading]);

  // Reset scroll on open
  useEffect(() => {
    if (isOpen && scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [isOpen]);

  const handleDownload = async () => {
    if (!reportContentRef.current || isDownloading) return;
    setIsDownloading(true);
    setDownloadProgress({ current: 1, total: totalPages || 1 });

    try {
      await downloadReportAsPdf(
        reportContentRef.current,
        pdfTitle,
        (current, total) => setDownloadProgress({ current, total })
      );
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 4000);
    } catch (err) {
      console.error('Download PDF error:', err);
      alert('Gagal mendownload PDF: ' + (err.message || 'Terjadi kesalahan sistem'));
    } finally {
      setIsDownloading(false);
      setDownloadProgress(null);
    }
  };

  // If autoDownload prop triggered, download after brief render timeout
  useEffect(() => {
    if (isOpen && autoDownload && student && !isDownloading) {
      const timer = setTimeout(() => {
        handleDownload();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isOpen, autoDownload, student]);

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
              disabled={isDownloading}
              className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-warm-200 rounded transition-all disabled:opacity-50"
              title="Zoom Out">
              <ChevronDown size={14} />
            </button>
            <span className="text-xs font-medium text-gray-600 w-12 text-center">{Math.round(scale * 100)}%</span>
            <button onClick={handleZoomIn}
              disabled={isDownloading}
              className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-warm-200 rounded transition-all disabled:opacity-50"
              title="Zoom In">
              <ChevronUp size={14} />
            </button>
            <div className="w-px h-4 bg-warm-300 mx-0.5" />
            <button onClick={handleFitWidth}
              disabled={isDownloading}
              className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-warm-200 rounded transition-all disabled:opacity-50"
              title="Fit Width">
              <Maximize2 size={13} />
            </button>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Primary Direct Download PDF Button */}
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-lg transition-all duration-200 shadow-sm
                ${downloadSuccess 
                  ? 'bg-emerald-700' 
                  : isDownloading 
                    ? 'bg-primary-500 cursor-not-allowed opacity-90' 
                    : 'bg-primary-600 hover:bg-primary-700 active:scale-95'
                }`}
              title={`Download PDF dengan nama ${pdfTitle}.pdf`}
            >
              {isDownloading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>
                    {downloadProgress 
                      ? `Memproses Hal. ${downloadProgress.current}/${downloadProgress.total}...` 
                      : 'Memproses PDF...'}
                  </span>
                </>
              ) : downloadSuccess ? (
                <>
                  <CheckCircle2 size={16} className="text-emerald-200" />
                  <span>Berhasil Diunduh!</span>
                </>
              ) : (
                <>
                  <Download size={16} />
                  <span>Download PDF</span>
                </>
              )}
            </button>

            {/* Secondary Print Button for direct paper printer */}
            <button
              onClick={onPrint}
              disabled={isDownloading}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 bg-warm-100 hover:bg-warm-200 hover:text-gray-800 rounded-lg transition-all duration-200 disabled:opacity-50"
              title="Cetak via printer fisik"
            >
              <Printer size={15} />
              <span>Cetak</span>
            </button>

            {/* Close Button */}
            <button onClick={onClose}
              disabled={isDownloading}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-warm-100 rounded-lg transition-all duration-200 disabled:opacity-50"
              title="Tutup (Esc)">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Feedback / notification strip during processing */}
        {isDownloading && (
          <div className="bg-primary-50 border-t border-primary-200 px-5 py-1.5 text-xs text-primary-800 flex items-center justify-between print:hidden">
            <span className="flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-primary-600 animate-pulse" />
              Menyiapkan dokumen <strong>{pdfTitle}.pdf</strong>... Dokumen akan langsung tersimpan di folder unduhan.
            </span>
            <span className="font-semibold text-primary-900">
              {downloadProgress ? `${Math.round((downloadProgress.current / downloadProgress.total) * 100)}%` : '0%'}
            </span>
          </div>
        )}
      </div>

      {/* ── Preview area ── */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-auto print-scroll"
        onClick={(e) => { if (e.target === e.currentTarget && !isDownloading) onClose(); }}
      >
        <div
          ref={reportContentRef}
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
      <div className="relative z-10 bg-white/90 backdrop-blur border-t border-warm-200 px-5 py-2 flex items-center justify-between text-xs text-gray-400 print:status">
        <div className="flex items-center gap-2">
          <GraduationCap size={13} />
          <span>Nama File Otomatis: <strong className="text-gray-600 font-mono">{pdfTitle}.pdf</strong></span>
        </div>
        <div className="flex items-center gap-3">
          <span>Zoom: {Math.round(scale * 100)}%</span>
          <span>{totalPages} Halaman</span>
          <span className="hidden sm:inline text-gray-300">Tekan Esc untuk menutup</span>
        </div>
      </div>
    </div>,
    document.body
  );
}
