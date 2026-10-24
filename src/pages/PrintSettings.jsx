import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import {
  Settings, Calendar, Save, CheckCircle, RotateCcw,
  Printer, Sparkles, Layers, Info, Check, Eye
} from 'lucide-react';

const MONTHS_EN = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const MONTHS_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const DEFAULT_SETTINGS = {
  mode: 'semester', // 'semester' | 'fixed' | 'realtime'
  month: 'December',
  year: new Date().getFullYear(),
  language: 'en', // 'en' | 'id'
  semester1: { month: 'December', year: new Date().getFullYear() },
  semester2: { month: 'June', year: new Date().getFullYear() + 1 },
};

export default function PrintSettings() {
  const { printSettings, setPrintSettings, activeYear, getSemesterLabel, showToast } = useApp();

  const [form, setForm] = useState(() => ({
    ...DEFAULT_SETTINGS,
    ...(printSettings || {}),
    semester1: { ...DEFAULT_SETTINGS.semester1, ...(printSettings?.semester1 || {}) },
    semester2: { ...DEFAULT_SETTINGS.semester2, ...(printSettings?.semester2 || {}) },
  }));

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [previewSemester, setPreviewSemester] = useState(1);

  // Sync when printSettings loaded from API
  useEffect(() => {
    if (printSettings) {
      setForm(prev => ({
        ...prev,
        ...printSettings,
        semester1: { ...DEFAULT_SETTINGS.semester1, ...(printSettings.semester1 || {}) },
        semester2: { ...DEFAULT_SETTINGS.semester2, ...(printSettings.semester2 || {}) },
      }));
    }
  }, [printSettings]);

  // Months list based on selected language
  const monthsList = useMemo(() => {
    return form.language === 'id' ? MONTHS_ID : MONTHS_EN;
  }, [form.language]);

  // Current year options (current year - 2 to current year + 5)
  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let y = currentYear - 3; y <= currentYear + 5; y++) {
      years.push(y);
    }
    return years;
  }, []);

  const handleModeChange = (mode) => {
    setForm(prev => ({ ...prev, mode }));
  };

  const handleLanguageChange = (language) => {
    // Map existing month names to new language if needed
    setForm(prev => {
      const mapMonth = (m) => {
        const idxEn = MONTHS_EN.indexOf(m);
        if (idxEn !== -1) return language === 'id' ? MONTHS_ID[idxEn] : MONTHS_EN[idxEn];
        const idxId = MONTHS_ID.indexOf(m);
        if (idxId !== -1) return language === 'id' ? MONTHS_ID[idxId] : MONTHS_EN[idxId];
        return m;
      };

      return {
        ...prev,
        language,
        month: mapMonth(prev.month),
        semester1: { ...prev.semester1, month: mapMonth(prev.semester1.month) },
        semester2: { ...prev.semester2, month: mapMonth(prev.semester2.month) },
      };
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const ok = await setPrintSettings(form);
      if (ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    const currentYear = new Date().getFullYear();
    const isIndo = form.language === 'id';
    setForm({
      mode: 'semester',
      month: isIndo ? 'Desember' : 'December',
      year: currentYear,
      language: form.language,
      semester1: { month: isIndo ? 'Desember' : 'December', year: currentYear },
      semester2: { month: isIndo ? 'Juni' : 'June', year: currentYear + 1 },
    });
    showToast('info', 'Pengaturan dikembalikan ke format default.');
  };

  // Compute preview print date
  const previewPrintDate = useMemo(() => {
    const now = new Date();
    const defMonth = form.language === 'id' ? MONTHS_ID[now.getMonth()] : MONTHS_EN[now.getMonth()];
    const defYear = now.getFullYear();

    if (form.mode === 'realtime') {
      return `${defMonth} ${defYear}`;
    }

    if (form.mode === 'semester') {
      const targetSem = previewSemester === 1 ? form.semester1 : form.semester2;
      return `${targetSem.month} ${targetSem.year}`;
    }

    // fixed
    return `${form.month} ${form.year}`;
  }, [form, previewSemester]);

  const activeYearStr = activeYear?.year || '2025/2026';
  const semesterLabel = getSemesterLabel(activeYear, previewSemester) || `Semester ${previewSemester}`;

  const inputCls = 'w-full px-3 py-2 text-sm border border-warm-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 bg-white';
  const labelCls = 'block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5';

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-11 h-11 bg-primary-100 rounded-xl text-primary-700 shadow-sm">
            <Settings size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-primary-900">Pengaturan Cetak</h1>
            <p className="text-sm text-gray-500">
              Konfigurasi titimangsa (bulan dan tahun cetak) pada laporan rapor siswa
            </p>
          </div>
        </div>

        <Link
          to="/laporan/rapor"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-700 bg-white border border-primary-200 hover:bg-primary-50 rounded-xl shadow-sm transition-all"
        >
          <Printer size={16} />
          <span>Lihat Cetak Rapor</span>
        </Link>
      </div>

      {/* Mode Selection Cards */}
      <div className="bg-white rounded-xl border border-warm-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-gray-800">Mode Titimangsa Rapor</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Tentukan bagaimana sistem menentukan bulan dan tahun pada dokumen rapor
            </p>
          </div>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full bg-primary-50 text-primary-700 border border-primary-100">
            Terintegrasi A4 Rapor
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
          {/* Option 1: Per Semester */}
          <div
            onClick={() => handleModeChange('semester')}
            className={`cursor-pointer rounded-xl p-4 border-2 transition-all relative ${
              form.mode === 'semester'
                ? 'border-primary-600 bg-primary-50/40 shadow-sm'
                : 'border-warm-200 hover:border-primary-300 hover:bg-warm-50/50'
            }`}
          >
            {form.mode === 'semester' && (
              <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-primary-600 text-white flex items-center justify-center">
                <Check size={12} strokeWidth={3} />
              </div>
            )}
            <div className="flex items-center gap-2 mb-1.5">
              <Layers size={17} className={form.mode === 'semester' ? 'text-primary-700' : 'text-gray-400'} />
              <h3 className="text-sm font-bold text-gray-800">Per Semester</h3>
            </div>
            <span className="inline-block text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 mb-2">
              Direkomendasikan
            </span>
            <p className="text-xs text-gray-500 leading-relaxed">
              Bulan & tahun diatur terpisah untuk Semester 1 dan Semester 2. Otomatis mencocokkan semester rapor yang dicetak.
            </p>
          </div>

          {/* Option 2: Fixed / Manual */}
          <div
            onClick={() => handleModeChange('fixed')}
            className={`cursor-pointer rounded-xl p-4 border-2 transition-all relative ${
              form.mode === 'fixed'
                ? 'border-primary-600 bg-primary-50/40 shadow-sm'
                : 'border-warm-200 hover:border-primary-300 hover:bg-warm-50/50'
            }`}
          >
            {form.mode === 'fixed' && (
              <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-primary-600 text-white flex items-center justify-center">
                <Check size={12} strokeWidth={3} />
              </div>
            )}
            <div className="flex items-center gap-2 mb-1.5">
              <Calendar size={17} className={form.mode === 'fixed' ? 'text-primary-700' : 'text-gray-400'} />
              <h3 className="text-sm font-bold text-gray-800">Tetap / Manual</h3>
            </div>
            <span className="inline-block text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-100 text-amber-800 mb-2">
              Satu Waktu
            </span>
            <p className="text-xs text-gray-500 leading-relaxed">
              Menentukan satu bulan dan tahun cetak yang seragam untuk semua rapor tanpa melihat semester.
            </p>
          </div>

          {/* Option 3: Realtime */}
          <div
            onClick={() => handleModeChange('realtime')}
            className={`cursor-pointer rounded-xl p-4 border-2 transition-all relative ${
              form.mode === 'realtime'
                ? 'border-primary-600 bg-primary-50/40 shadow-sm'
                : 'border-warm-200 hover:border-primary-300 hover:bg-warm-50/50'
            }`}
          >
            {form.mode === 'realtime' && (
              <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-primary-600 text-white flex items-center justify-center">
                <Check size={12} strokeWidth={3} />
              </div>
            )}
            <div className="flex items-center gap-2 mb-1.5">
              <Calendar size={17} className={form.mode === 'realtime' ? 'text-primary-700' : 'text-gray-400'} />
              <h3 className="text-sm font-bold text-gray-800">Real-Time</h3>
            </div>
            <span className="inline-block text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-gray-100 text-gray-600 mb-2">
              Otomatis
            </span>
            <p className="text-xs text-gray-500 leading-relaxed">
              Mengikuti bulan dan tahun saat ini secara aktif ketika dokumen rapor dicetak (tanggal berjalan).
            </p>
          </div>
        </div>
      </div>

      {/* Language Selection */}
      <div className="bg-white rounded-xl border border-warm-200 shadow-sm p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-gray-800">Bahasa Bulan Titimangsa</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Pilih format penulisan nama bulan yang akan dicantumkan pada footer rapor
            </p>
          </div>
          <div className="flex items-center gap-2 bg-warm-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => handleLanguageChange('en')}
              className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                form.language === 'en'
                  ? 'bg-white text-primary-800 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              English (e.g. December)
            </button>
            <button
              type="button"
              onClick={() => handleLanguageChange('id')}
              className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                form.language === 'id'
                  ? 'bg-white text-primary-800 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Indonesia (cth: Desember)
            </button>
          </div>
        </div>
      </div>

      {/* Detail Input based on Mode */}
      {form.mode === 'semester' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Semester 1 */}
          <div className="bg-white rounded-xl border border-warm-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-warm-100">
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-lg bg-primary-100 text-primary-700 font-bold text-xs flex items-center justify-center">
                  1
                </span>
                <div>
                  <h3 className="text-sm font-bold text-gray-800">Semester 1 (Ganjil)</h3>
                  <p className="text-xs text-gray-400">Biasanya dibagikan akhir semester ganjil</p>
                </div>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-primary-50 text-primary-700">
                {form.semester1.month} {form.semester1.year}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Bulan Cetak</label>
                <select
                  value={form.semester1.month}
                  onChange={e => setForm(prev => ({
                    ...prev,
                    semester1: { ...prev.semester1, month: e.target.value }
                  }))}
                  className={inputCls}
                >
                  {monthsList.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelCls}>Tahun Cetak</label>
                <select
                  value={form.semester1.year}
                  onChange={e => setForm(prev => ({
                    ...prev,
                    semester1: { ...prev.semester1, year: Number(e.target.value) }
                  }))}
                  className={inputCls}
                >
                  {yearOptions.map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Semester 2 */}
          <div className="bg-white rounded-xl border border-warm-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-warm-100">
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-lg bg-primary-100 text-primary-700 font-bold text-xs flex items-center justify-center">
                  2
                </span>
                <div>
                  <h3 className="text-sm font-bold text-gray-800">Semester 2 (Genap)</h3>
                  <p className="text-xs text-gray-400">Biasanya dibagikan akhir tahun ajaran</p>
                </div>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-primary-50 text-primary-700">
                {form.semester2.month} {form.semester2.year}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Bulan Cetak</label>
                <select
                  value={form.semester2.month}
                  onChange={e => setForm(prev => ({
                    ...prev,
                    semester2: { ...prev.semester2, month: e.target.value }
                  }))}
                  className={inputCls}
                >
                  {monthsList.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelCls}>Tahun Cetak</label>
                <select
                  value={form.semester2.year}
                  onChange={e => setForm(prev => ({
                    ...prev,
                    semester2: { ...prev.semester2, year: Number(e.target.value) }
                  }))}
                  className={inputCls}
                >
                  {yearOptions.map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {form.mode === 'fixed' && (
        <div className="bg-white rounded-xl border border-warm-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-warm-100">
            <div>
              <h3 className="text-sm font-bold text-gray-800">Bulan & Tahun Tetap</h3>
              <p className="text-xs text-gray-400">Akan digunakan untuk seluruh dokumen rapor yang dicetak</p>
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-lg bg-primary-50 text-primary-700">
              {form.month} {form.year}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg">
            <div>
              <label className={labelCls}>Bulan Cetak</label>
              <select
                value={form.month}
                onChange={e => setForm(prev => ({ ...prev, month: e.target.value }))}
                className={inputCls}
              >
                {monthsList.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelCls}>Tahun Cetak</label>
              <select
                value={form.year}
                onChange={e => setForm(prev => ({ ...prev, year: Number(e.target.value) }))}
                className={inputCls}
              >
                {yearOptions.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {form.mode === 'realtime' && (
        <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-5 flex items-start gap-3">
          <Info size={20} className="text-blue-600 shrink-0 mt-0.5" />
          <div className="text-xs text-blue-900 space-y-1">
            <p className="font-bold text-sm">Mode Real-Time Aktif</p>
            <p>
              Pada mode ini, bulan dan tahun cetak akan selalu diperbarui secara otomatis mengikuti tanggal saat tombol
              preview atau print ditekan di halaman Cetak Rapor.
            </p>
            <p className="text-blue-700 font-medium">
              Tanggal cetak saat ini: {previewPrintDate}
            </p>
          </div>
        </div>
      )}

      {/* Live Preview of Report Footer */}
      <div className="bg-white rounded-xl border border-warm-200 shadow-sm p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-warm-100">
          <div className="flex items-center gap-2">
            <Eye size={18} className="text-primary-700" />
            <h2 className="text-base font-bold text-gray-800">Simulasi Tampilan Footer Rapor</h2>
          </div>

          {form.mode === 'semester' && (
            <div className="flex items-center gap-1 bg-warm-100 p-1 rounded-lg text-xs">
              <span className="text-gray-500 px-2 font-medium">Simulasikan Semester:</span>
              <button
                type="button"
                onClick={() => setPreviewSemester(1)}
                className={`px-3 py-1 rounded font-semibold transition-all ${
                  previewSemester === 1 ? 'bg-primary-600 text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Sem 1
              </button>
              <button
                type="button"
                onClick={() => setPreviewSemester(2)}
                className={`px-3 py-1 rounded font-semibold transition-all ${
                  previewSemester === 2 ? 'bg-primary-600 text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Sem 2
              </button>
            </div>
          )}
        </div>

        {/* Realistic A4 Footer Preview Box */}
        <div className="p-6 bg-warm-50/80 rounded-xl border border-warm-200/80">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Area Footer Halaman Rapor (A4)
          </p>

          <div className="bg-white rounded-lg border border-gray-300 shadow-sm p-4 pt-3">
            <div className="flex items-end justify-between text-[11px] text-gray-400 border-t border-gray-200 pt-3">
              {/* Left student info */}
              <div className="flex flex-col gap-0.5">
                <span className="font-semibold text-gray-600">
                  0112301194 &mdash; Alaric Aksara Mizan &mdash; 8A
                </span>
                <span className="text-gray-400">
                  {semesterLabel}, report - {activeYearStr}
                </span>
              </div>

              {/* Right date & page info */}
              <div className="flex flex-col items-end gap-1">
                <span className="font-bold text-xs text-primary-900 bg-primary-50 border border-primary-200 px-2.5 py-0.5 rounded shadow-2xs">
                  {previewPrintDate}
                </span>
                <span className="font-medium text-gray-500 text-[10px]">Page 1 of 6</span>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-gray-400 mt-2 text-right">
            Bagian yang disorot di atas adalah teks titimangsa yang akan dicetak di seluruh halaman rapor.
          </p>
        </div>
      </div>

      {/* Action Footer */}
      <div className="bg-white rounded-xl border border-warm-200 shadow-sm p-4 px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
        <button
          type="button"
          onClick={handleReset}
          className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-gray-600 hover:text-gray-800 hover:bg-warm-100 rounded-lg transition-all"
        >
          <RotateCcw size={14} />
          <span>Reset ke Default</span>
        </button>

        <div className="flex items-center gap-3">
          {saved && (
            <div className="flex items-center gap-1.5 text-emerald-600 text-xs font-semibold animate-fade-in">
              <CheckCircle size={15} />
              <span>Pengaturan berhasil disimpan</span>
            </div>
          )}

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 active:bg-primary-800 rounded-xl shadow-sm hover:shadow transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save size={16} />
            <span>{saving ? 'Menyimpan...' : 'Simpan Pengaturan'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
