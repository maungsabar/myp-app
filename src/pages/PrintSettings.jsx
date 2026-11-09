import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import {
  Settings, Calendar, Save, CheckCircle, RotateCcw,
  Printer, Sparkles, Layers, Info, Check, Eye, UserCheck, EyeOff,
  BookOpen, Upload, Trash2, Image as ImageIcon, Globe, Type
} from 'lucide-react';

const MONTHS_EN = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const MONTHS_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const DEFAULT_COVER_SETTINGS = {
  enabled: true,
  leftLogo: null,
  rightLogo: null,
  customVisual: null,
  title: 'ACADEMIC REPORT CARD',
  subtitle: 'MIDDLE YEARS PROGRAMME',
  motto: 'Inquire-Act-Reflect',
  showMotto: true,
  website: '',
  mypYearMap: {
    7: 'Grade 7 / MYP Year 2',
    8: 'Grade 8 / MYP Year 3',
    9: 'Grade 9 / MYP Year 4',
  },
};

const DEFAULT_SETTINGS = {
  mode: 'semester', // 'semester' | 'fixed' | 'realtime'
  date: new Date().getDate(),
  month: 'December',
  year: new Date().getFullYear(),
  language: 'en', // 'en' | 'id'
  semester1: { date: 20, month: 'December', year: new Date().getFullYear() },
  semester2: { date: 20, month: 'June', year: new Date().getFullYear() + 1 },
  showPresentInAttendance: false,
  cover: DEFAULT_COVER_SETTINGS,
};

export default function PrintSettings() {
  const { printSettings, setPrintSettings, activeYear, getSemesterLabel, showToast, schoolProfile, ibProfileLogo } = useApp();

  const [form, setForm] = useState(() => ({
    ...DEFAULT_SETTINGS,
    ...(printSettings || {}),
    date: printSettings?.date ?? DEFAULT_SETTINGS.date,
    semester1: {
      ...DEFAULT_SETTINGS.semester1,
      ...(printSettings?.semester1 || {}),
      date: printSettings?.semester1?.date ?? DEFAULT_SETTINGS.semester1.date,
    },
    semester2: {
      ...DEFAULT_SETTINGS.semester2,
      ...(printSettings?.semester2 || {}),
      date: printSettings?.semester2?.date ?? DEFAULT_SETTINGS.semester2.date,
    },
    cover: {
      ...DEFAULT_COVER_SETTINGS,
      ...(printSettings?.cover || {}),
      motto: (!printSettings?.cover?.motto || printSettings?.cover?.motto === 'Inquire - Think - Grow')
        ? 'Inquire-Act-Reflect'
        : printSettings.cover.motto,
      mypYearMap: {
        ...DEFAULT_COVER_SETTINGS.mypYearMap,
        ...(printSettings?.cover?.mypYearMap || {}),
      },
    },
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
        date: printSettings.date ?? prev.date ?? DEFAULT_SETTINGS.date,
        semester1: {
          ...DEFAULT_SETTINGS.semester1,
          ...(printSettings.semester1 || {}),
          date: printSettings.semester1?.date ?? DEFAULT_SETTINGS.semester1.date,
        },
        semester2: {
          ...DEFAULT_SETTINGS.semester2,
          ...(printSettings.semester2 || {}),
          date: printSettings.semester2?.date ?? DEFAULT_SETTINGS.semester2.date,
        },
        cover: {
          ...DEFAULT_COVER_SETTINGS,
          ...(printSettings.cover || {}),
          motto: (!printSettings.cover?.motto || printSettings.cover.motto === 'Inquire - Think - Grow')
            ? 'Inquire-Act-Reflect'
            : printSettings.cover.motto,
          mypYearMap: {
            ...DEFAULT_COVER_SETTINGS.mypYearMap,
            ...(printSettings.cover?.mypYearMap || {}),
          },
        },
      }));
    }
  }, [printSettings]);

  const updateCover = (updates) => {
    setForm(prev => ({
      ...prev,
      cover: {
        ...prev.cover,
        ...updates,
      },
    }));
  };

  const updateMypYearMap = (grade, value) => {
    setForm(prev => ({
      ...prev,
      cover: {
        ...prev.cover,
        mypYearMap: {
          ...(prev.cover?.mypYearMap || DEFAULT_COVER_SETTINGS.mypYearMap),
          [grade]: value,
        },
      },
    }));
  };

  const handleImageUpload = (field, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('error', 'Format file harus berupa gambar (PNG, JPG, SVG, WebP).');
      return;
    }
    if (file.size > 2.5 * 1024 * 1024) {
      showToast('error', 'Ukuran gambar maksimal 2.5 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      updateCover({ [field]: reader.result });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Day options (1 - 31)
  const dayOptions = useMemo(() => {
    const days = [];
    for (let d = 1; d <= 31; d++) {
      days.push(d);
    }
    return days;
  }, []);

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
    const currentDate = new Date().getDate();
    const isIndo = form.language === 'id';
    setForm({
      mode: 'semester',
      date: currentDate,
      month: isIndo ? 'Desember' : 'December',
      year: currentYear,
      language: form.language,
      semester1: { date: 20, month: isIndo ? 'Desember' : 'December', year: currentYear },
      semester2: { date: 20, month: isIndo ? 'Juni' : 'June', year: currentYear + 1 },
      showPresentInAttendance: false,
      cover: {
        ...DEFAULT_COVER_SETTINGS,
        motto: 'Inquire-Act-Reflect',
      },
    });
    showToast('info', 'Pengaturan dikembalikan ke format default.');
  };

  // Compute preview print date
  const previewPrintDate = useMemo(() => {
    const now = new Date();
    const defDate = now.getDate();
    const defMonth = form.language === 'id' ? MONTHS_ID[now.getMonth()] : MONTHS_EN[now.getMonth()];
    const defYear = now.getFullYear();

    if (form.mode === 'realtime') {
      return `${defMonth} ${defDate}, ${defYear}`;
    }

    if (form.mode === 'semester') {
      const targetSem = previewSemester === 1 ? form.semester1 : form.semester2;
      const m = targetSem?.month || defMonth;
      const y = targetSem?.year || defYear;
      return targetSem?.date ? `${m} ${targetSem.date}, ${y}` : `${m} ${y}`;
    }

    // fixed
    const m = form.month || defMonth;
    const y = form.year || defYear;
    return form.date ? `${m} ${form.date}, ${y}` : `${m} ${y}`;
  }, [form, previewSemester]);

  const activeYearStr = activeYear?.year || '2025/2026';
  const semesterLabel = getSemesterLabel(activeYear, previewSemester) || `Semester ${previewSemester}`;

  const coverCfg = form.cover || DEFAULT_COVER_SETTINGS;
  const activeLeftLogo = coverCfg.leftLogo || schoolProfile?.logo;
  const activeCenterVisual = coverCfg.customVisual || ibProfileLogo;
  const contactParts = [
    coverCfg.website?.trim(),
    schoolProfile?.phone ? `Telp: ${schoolProfile.phone}` : null,
    schoolProfile?.email ? `Email: ${schoolProfile.email}` : null,
  ].filter(Boolean);

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
              Konfigurasi sampul (cover rapor), kolom kehadiran, dan titimangsa cetak pada rapor siswa
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

      {/* Report Cover / Sampul Rapor Management */}
      <div className="bg-white rounded-xl border border-warm-200 shadow-sm p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-warm-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <BookOpen size={18} className="text-primary-700" />
              <h2 className="text-base font-bold text-gray-800">Sampul / Cover Rapor (Halaman Depan)</h2>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Kelola halaman sampul depan rapor MYP: logo sekolah &amp; MYP, judul laporan, profil siswa, visual IB Learner Profile, dan identitas sekolah
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => updateCover({ enabled: !coverCfg.enabled })}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-full border transition-all ${
                coverCfg.enabled
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                  : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${coverCfg.enabled ? 'bg-emerald-500' : 'bg-gray-400'}`} />
              {coverCfg.enabled ? 'Sampul Aktif (Ditampilkan)' : 'Sampul Nonaktif (Disembunyikan)'}
            </button>
          </div>
        </div>

        {/* Enable / Disable selection cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div
            onClick={() => updateCover({ enabled: true })}
            className={`cursor-pointer rounded-xl p-4 border-2 transition-all relative ${
              coverCfg.enabled
                ? 'border-primary-600 bg-primary-50/40 shadow-sm'
                : 'border-warm-200 hover:border-primary-300 hover:bg-warm-50/50'
            }`}
          >
            {coverCfg.enabled && (
              <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-primary-600 text-white flex items-center justify-center">
                <Check size={12} strokeWidth={3} />
              </div>
            )}
            <div className="flex items-center gap-2 mb-1">
              <Eye size={16} className={coverCfg.enabled ? 'text-primary-700' : 'text-gray-400'} />
              <h3 className="text-sm font-bold text-gray-800">Tampilkan Sampul / Cover Rapor</h3>
            </div>
            <p className="text-xs text-gray-500">
              Menambahkan halaman sampul resmi di halaman paling depan sebelum surat pengantar (Cover Letter).
            </p>
          </div>

          <div
            onClick={() => updateCover({ enabled: false })}
            className={`cursor-pointer rounded-xl p-4 border-2 transition-all relative ${
              !coverCfg.enabled
                ? 'border-primary-600 bg-primary-50/40 shadow-sm'
                : 'border-warm-200 hover:border-primary-300 hover:bg-warm-50/50'
            }`}
          >
            {!coverCfg.enabled && (
              <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-primary-600 text-white flex items-center justify-center">
                <Check size={12} strokeWidth={3} />
              </div>
            )}
            <div className="flex items-center gap-2 mb-1">
              <EyeOff size={16} className={!coverCfg.enabled ? 'text-primary-700' : 'text-gray-400'} />
              <h3 className="text-sm font-bold text-gray-800">Sembunyikan Sampul</h3>
            </div>
            <p className="text-xs text-gray-500">
              Rapor langsung dimulai dari halaman surat pengantar kepala sekolah tanpa halaman sampul depan.
            </p>
          </div>
        </div>

        {coverCfg.enabled && (
          <div className="space-y-6 pt-2">
            {/* 1. Logo & Visual Configuration */}
            <div>
              <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <ImageIcon size={14} className="text-primary-600" />
                <span>Logo &amp; Visual Grafis Sampul</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Left Logo: School Logo / Custom Left Logo */}
                <div className="border border-warm-200 rounded-xl p-4 bg-warm-50/40 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-gray-700">Logo Kiri (Sekolah)</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-primary-50 text-primary-700 font-semibold">
                        {coverCfg.leftLogo ? 'Logo Khusus' : 'Dari Profil'}
                      </span>
                    </div>
                    <div className="h-24 bg-white border border-gray-200 rounded-lg flex items-center justify-center p-2 mb-2">
                      {activeLeftLogo ? (
                        <img src={activeLeftLogo} alt="Logo Kiri Cover" className="max-h-20 max-w-full object-contain" />
                      ) : (
                        <span className="text-[11px] text-gray-400 italic text-center px-2">Belum ada Logo Sekolah</span>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-500 leading-relaxed">
                      Unggah <strong>Logo Khusus</strong> untuk pojok kiri atas. Jika tidak diunggah, otomatis menampilkan logo dari <strong>Profil Sekolah</strong>.
                    </p>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <label className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-lg cursor-pointer transition-colors">
                      <Upload size={13} />
                      <span>{coverCfg.leftLogo ? 'Ganti Logo' : 'Upload Logo'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={e => handleImageUpload('leftLogo', e)}
                        className="hidden"
                      />
                    </label>
                    {coverCfg.leftLogo && (
                      <button
                        type="button"
                        onClick={() => updateCover({ leftLogo: null })}
                        className="px-2.5 py-1.5 text-[11px] font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors"
                        title="Hapus logo khusus & gunakan Logo Profil Sekolah"
                      >
                        Pakai Profil
                      </button>
                    )}
                  </div>
                </div>

                {/* Right Logo: Official MYP Logo / Custom Right Logo */}
                <div className="border border-warm-200 rounded-xl p-4 bg-warm-50/40 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-gray-700">Logo Kanan (MYP / Khusus)</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-amber-50 text-amber-800 font-semibold">Kanan Atas</span>
                    </div>
                    <div className="h-24 bg-white border border-gray-200 rounded-lg flex items-center justify-center p-2 mb-2">
                      {coverCfg.rightLogo ? (
                        <img src={coverCfg.rightLogo} alt="Logo Kanan Cover" className="max-h-20 max-w-full object-contain" />
                      ) : (
                        <span className="text-[11px] text-gray-400 italic text-center px-2">
                          Belum diunggah (Tampil badge MYP default)
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-500 leading-relaxed">
                      Unggah <strong>Logo Resmi IB MYP</strong> atau logo yayasan/khusus untuk pojok kanan atas.
                    </p>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <label className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-lg cursor-pointer transition-colors">
                      <Upload size={13} />
                      <span>{coverCfg.rightLogo ? 'Ganti Logo' : 'Upload Logo'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={e => handleImageUpload('rightLogo', e)}
                        className="hidden"
                      />
                    </label>
                    {coverCfg.rightLogo && (
                      <button
                        type="button"
                        onClick={() => updateCover({ rightLogo: null })}
                        className="p-1.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                        title="Hapus Logo Kanan"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Center Visual: IB Learner Profile Wheel / Custom Visual */}
                <div className="border border-warm-200 rounded-xl p-4 bg-warm-50/40 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-gray-700">Visual / Grafis Tengah</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold">
                        {coverCfg.customVisual ? 'Gambar Khusus' : 'Logo IB Profile'}
                      </span>
                    </div>
                    <div className="h-24 bg-white border border-gray-200 rounded-lg flex items-center justify-center p-2 mb-2">
                      {activeCenterVisual ? (
                        <img src={activeCenterVisual} alt="Visual Cover" className="max-h-20 max-w-full object-contain" />
                      ) : (
                        <span className="text-[11px] text-gray-400 italic text-center px-2">
                          Belum ada Logo IB Learner Profile
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-500 leading-relaxed">
                      Default diambil dari <strong>Logo IB Learner Profile</strong>. Anda juga bisa mengunggah ilustrasi khusus.
                    </p>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <label className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-primary-700 bg-white border border-primary-200 hover:bg-primary-50 rounded-lg cursor-pointer transition-colors">
                      <Upload size={13} />
                      <span>{coverCfg.customVisual ? 'Ganti Visual' : 'Visual Khusus'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={e => handleImageUpload('customVisual', e)}
                        className="hidden"
                      />
                    </label>
                    {coverCfg.customVisual && (
                      <button
                        type="button"
                        onClick={() => updateCover({ customVisual: null })}
                        className="px-2.5 py-1.5 text-[11px] font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors"
                        title="Gunakan kembali Logo IB Learner Profile"
                      >
                        Pakai Default IB
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Text & Headings Configuration */}
            <div className="border-t border-warm-100 pt-5">
              <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Type size={14} className="text-primary-600" />
                <span>Teks Judul, Motto &amp; Kontak Sekolah</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Judul Utama Rapor</label>
                  <input
                    type="text"
                    value={coverCfg.title || ''}
                    onChange={e => updateCover({ title: e.target.value })}
                    placeholder="ACADEMIC REPORT CARD"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Sub-Judul Program</label>
                  <input
                    type="text"
                    value={coverCfg.subtitle || ''}
                    onChange={e => updateCover({ subtitle: e.target.value })}
                    placeholder="MIDDLE YEARS PROGRAMME"
                    className={inputCls}
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Tagline / Motto Sampul
                    </label>
                    <label className="inline-flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(coverCfg.showMotto)}
                        onChange={e => updateCover({ showMotto: e.target.checked })}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span>Tampilkan Motto</span>
                    </label>
                  </div>
                  <input
                    type="text"
                    value={coverCfg.motto || ''}
                    onChange={e => updateCover({ motto: e.target.value })}
                    placeholder="Inquire-Act-Reflect"
                    disabled={!coverCfg.showMotto}
                    className={`${inputCls} ${!coverCfg.showMotto ? 'opacity-50 bg-gray-50' : ''}`}
                  />
                </div>
                <div>
                  <label className={labelCls}>Website Sekolah (Footer Cover)</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={coverCfg.website || ''}
                      onChange={e => updateCover({ website: e.target.value })}
                      placeholder="contoh: www.sekolah.sch.id"
                      className={inputCls}
                    />
                  </div>
                </div>
              </div>

              {/* MYP Year Mapping */}
              <div className="mt-4">
                <label className={labelCls}>Format Label &ldquo;Grade / MYP Year&rdquo; pada Student Profile</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[7, 8, 9].map(g => (
                    <div key={g}>
                      <span className="block text-[11px] text-gray-400 mb-1">Kelas {g} (Grade {g})</span>
                      <input
                        type="text"
                        value={coverCfg.mypYearMap?.[g] ?? `Grade ${g} / MYP Year ${g - 5}`}
                        onChange={e => updateMypYearMap(g, e.target.value)}
                        className={inputCls}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 3. Live Preview of Cover Page */}
            <div className="border-t border-warm-100 pt-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Eye size={16} className="text-primary-700" />
                  <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Simulasi Tampilan Sampul Rapor (A4)
                  </h3>
                </div>
                <span className="text-[11px] text-gray-400">Pratinjau proporsional halaman depan</span>
              </div>

              <div className="bg-warm-50/90 border border-warm-200 rounded-xl p-4 sm:p-6 flex justify-center">
                <div
                  className="border border-gray-300 shadow-md rounded-sm w-full max-w-[480px] p-3"
                  style={{
                    minHeight: '660px',
                    backgroundColor: '#f8f7f3',
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%23d6d1c4' stroke-width='0.7' stroke-opacity='0.45'%3E%3Cpolygon points='40,4 49,22 68,12 58,31 76,40 58,49 68,68 49,58 40,76 31,58 12,68 22,49 4,40 22,31 12,12 31,22'/%3E%3Ccircle cx='40' cy='40' r='14'/%3E%3Crect x='22' y='22' width='36' height='36' transform='rotate(45 40 40)'/%3E%3C/g%3E%3C/svg%3E")`,
                    fontFamily: "'Montserrat', sans-serif",
                  }}
                >
                  <div
                    className="w-full h-full p-5 sm:p-6 flex flex-col justify-between text-gray-800"
                    style={{
                      minHeight: '634px',
                      backgroundColor: 'rgba(255, 255, 255, 0.94)',
                      border: '1.5px solid #c5a869',
                      boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
                    }}
                  >
                    {/* Top Bar: Left & Right Logos */}
                    <div className="flex items-center justify-between gap-4">
                      <div className="h-14 flex items-center">
                        {activeLeftLogo ? (
                          <img src={activeLeftLogo} alt="Logo Sekolah" className="max-h-14 max-w-[160px] w-auto object-contain" />
                        ) : (
                          <div className="px-3 py-2 border border-dashed border-gray-300 rounded text-[10px] text-gray-400 font-semibold">
                            [ LOGO SEKOLAH ]
                          </div>
                        )}
                      </div>
                      <div className="h-14 flex items-center">
                        {coverCfg.rightLogo ? (
                          <img src={coverCfg.rightLogo} alt="Logo MYP" className="max-h-14 max-w-[175px] w-auto object-contain" />
                        ) : (
                          <div className="px-3 py-1.5 border-2 border-[#0d233a] rounded text-right">
                            <div className="text-[9px] font-extrabold tracking-widest text-[#0d233a]">IB WORLD SCHOOL</div>
                            <div className="text-[8px] font-semibold tracking-wider text-[#b08d44]">MIDDLE YEARS PROGRAMME</div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Title Block with Ornamental Divider */}
                    <div className="text-center my-2">
                      <h4
                        className="text-lg font-bold tracking-wider uppercase leading-tight"
                        style={{ fontFamily: "Georgia, 'Times New Roman', serif", color: '#0d233a' }}
                      >
                        {coverCfg.title || 'ACADEMIC REPORT CARD'}
                      </h4>
                      <p
                        className="text-xs font-bold tracking-widest uppercase mt-0.5"
                        style={{ fontFamily: "Georgia, 'Times New Roman', serif", color: '#0d233a' }}
                      >
                        {coverCfg.subtitle || 'MIDDLE YEARS PROGRAMME'}
                      </p>
                      <p className="text-[11px] font-bold tracking-wider uppercase mt-2" style={{ color: '#b08d44' }}>
                        SEMESTER {previewSemester} REPORT
                      </p>
                      <p className="text-[11px] font-bold tracking-wider uppercase" style={{ color: '#0d233a' }}>
                        ACADEMIC YEAR: {activeYearStr}
                      </p>

                      {/* Ornamental Divider SVG */}
                      <div className="flex justify-center mt-2">
                        <svg viewBox="0 0 500 18" className="w-4/5 h-3" fill="none">
                          <polygon points="0,9 228,7.2 228,10.8" fill="#0d233a" />
                          <polygon points="500,9 272,7.2 272,10.8" fill="#0d233a" />
                          <polygon points="231,9 236,6 241,9 236,12" fill="#0d233a" />
                          <polygon points="259,9 264,6 269,9 264,12" fill="#0d233a" />
                          <polygon points="241,9 250,1.5 259,9 250,16.5" fill="#c5a869" />
                          <polygon points="244,9 250,4 256,9 250,14" fill="#0d233a" />
                        </svg>
                      </div>
                    </div>

                    {/* Student Profile Box */}
                    <div className="my-2">
                      <div
                        className="text-xs font-bold tracking-wider text-center uppercase mb-2"
                        style={{ fontFamily: "Georgia, 'Times New Roman', serif", color: '#0d233a' }}
                      >
                        STUDENT PROFILE
                      </div>
                      <table className="w-full text-[10.5px] border-collapse">
                        <tbody>
                          <tr style={{ backgroundColor: '#e6e8ea', borderTop: '1px solid #d1d5db', borderBottom: '1px solid #d1d5db' }}>
                            <td className="py-1.5 pl-3 pr-1 font-medium text-gray-900 w-36">Student Full Name</td>
                            <td className="py-1.5 text-gray-800 font-semibold w-3 text-center">:</td>
                            <td className="py-1.5 pl-1 pr-3 font-bold text-gray-900">ABRAHAM KENZIE PRIHANDOKO</td>
                          </tr>
                          <tr>
                            <td className="py-1.5 pl-3 pr-1 font-medium text-gray-900">Student ID Number</td>
                            <td className="py-1.5 text-gray-800 font-semibold text-center">:</td>
                            <td className="py-1.5 pl-1 pr-3 font-medium text-gray-900">3125883710</td>
                          </tr>
                          <tr style={{ backgroundColor: '#e6e8ea', borderTop: '1px solid #d1d5db', borderBottom: '1px solid #d1d5db' }}>
                            <td className="py-1.5 pl-3 pr-1 font-medium text-gray-900">Grade / MYP Year</td>
                            <td className="py-1.5 text-gray-800 font-semibold text-center">:</td>
                            <td className="py-1.5 pl-1 pr-3 font-medium text-gray-900">
                              {coverCfg.mypYearMap?.[7] || 'Grade 7 / MYP Year 2'} (7A)
                            </td>
                          </tr>
                          <tr>
                            <td className="py-1.5 pl-3 pr-1 font-medium text-gray-900">Homeroom Teacher</td>
                            <td className="py-1.5 text-gray-800 font-semibold text-center">:</td>
                            <td className="py-1.5 pl-1 pr-3 font-medium text-gray-900">-</td>
                          </tr>
                          <tr style={{ backgroundColor: '#e6e8ea', borderTop: '1px solid #d1d5db', borderBottom: '1px solid #d1d5db' }}>
                            <td className="py-1.5 pl-3 pr-1 font-medium text-gray-900">Date of Issue</td>
                            <td className="py-1.5 text-gray-800 font-semibold text-center">:</td>
                            <td className="py-1.5 pl-1 pr-3 font-medium text-gray-900">{previewPrintDate}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Visual / Graphic: IB Learner Profile Wheel */}
                    <div className="my-2 flex flex-col items-center justify-center text-center">
                      {activeCenterVisual ? (
                        <img
                          src={activeCenterVisual}
                          alt="IB Learner Profile Visual"
                          className="max-h-32 w-auto object-contain mx-auto"
                        />
                      ) : (
                        <div className="w-28 h-28 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center p-3 text-[10px] text-gray-400">
                          [ Visual Roda IB Learner Profile ]
                        </div>
                      )}
                      {coverCfg.showMotto && coverCfg.motto && (
                        <p
                          className="mt-2 text-xs italic"
                          style={{ fontFamily: "Georgia, 'Times New Roman', serif", color: '#0d233a' }}
                        >
                          &ldquo;{coverCfg.motto}&rdquo;
                        </p>
                      )}
                    </div>

                    {/* Footer: Ornamental Divider + School Name, Address, Website & Contact */}
                    <div className="text-center space-y-0.5">
                      <div className="flex justify-center mb-2">
                        <svg viewBox="0 0 500 18" className="w-4/5 h-3" fill="none">
                          <polygon points="0,9 228,7.2 228,10.8" fill="#0d233a" />
                          <polygon points="500,9 272,7.2 272,10.8" fill="#0d233a" />
                          <polygon points="231,9 236,6 241,9 236,12" fill="#0d233a" />
                          <polygon points="259,9 264,6 269,9 264,12" fill="#0d233a" />
                          <polygon points="241,9 250,1.5 259,9 250,16.5" fill="#c5a869" />
                          <polygon points="244,9 250,4 256,9 250,14" fill="#0d233a" />
                        </svg>
                      </div>
                      <p className="text-sm font-extrabold tracking-wider" style={{ color: '#0d233a' }}>
                        {schoolProfile?.name === 'MTS MILBOS' ? 'MTs MILBoS' : (schoolProfile?.name || 'MTs MILBoS')}
                      </p>
                      {schoolProfile?.address && (
                        <p className="text-[10px] font-medium text-gray-900 leading-relaxed">
                          {schoolProfile.address}
                        </p>
                      )}
                      {contactParts.length > 0 && (
                        <p className="text-[9.5px] font-medium text-gray-900">
                          {contactParts.join(' • ')}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Attendance "Present" Column Enable / Disable */}
      <div className="bg-white rounded-xl border border-warm-200 shadow-sm p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <UserCheck size={18} className="text-primary-700" />
              <h2 className="text-base font-bold text-gray-800">Kolom Kehadiran &ldquo;Present&rdquo; (Hadir)</h2>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Atur apakah kolom <strong>Present</strong> ditampilkan pada halaman input kehadiran wali kelas dan dicetak pada tabel <em>Attendance Record</em> di rapor
            </p>
          </div>

          <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full border shrink-0 ${
            form.showPresentInAttendance
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-gray-100 text-gray-600 border-gray-200'
          }`}>
            <span className={`w-2 h-2 rounded-full ${form.showPresentInAttendance ? 'bg-emerald-500' : 'bg-gray-400'}`} />
            {form.showPresentInAttendance ? 'Enable (Ditampilkan)' : 'Disable (Disembunyikan)'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
          {/* Option Disable (Default / Umum) */}
          <div
            onClick={() => setForm(prev => ({ ...prev, showPresentInAttendance: false }))}
            className={`cursor-pointer rounded-xl p-4 border-2 transition-all relative ${
              !form.showPresentInAttendance
                ? 'border-primary-600 bg-primary-50/40 shadow-sm'
                : 'border-warm-200 hover:border-primary-300 hover:bg-warm-50/50'
            }`}
          >
            {!form.showPresentInAttendance && (
              <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-primary-600 text-white flex items-center justify-center">
                <Check size={12} strokeWidth={3} />
              </div>
            )}
            <div className="flex items-center gap-2 mb-1.5">
              <EyeOff size={17} className={!form.showPresentInAttendance ? 'text-primary-700' : 'text-gray-400'} />
              <h3 className="text-sm font-bold text-gray-800">Disable &ldquo;Present&rdquo;</h3>
            </div>
            <span className="inline-block text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 mb-2">
              Standar Umum Rapor
            </span>
            <p className="text-xs text-gray-500 leading-relaxed">
              Kolom input <strong>Present</strong> tidak muncul di halaman wali kelas dan tidak tampil pada output rapor. Tabel hanya menampilkan <em>Unexcused, Sick, Excused</em>.
            </p>
          </div>

          {/* Option Enable */}
          <div
            onClick={() => setForm(prev => ({ ...prev, showPresentInAttendance: true }))}
            className={`cursor-pointer rounded-xl p-4 border-2 transition-all relative ${
              form.showPresentInAttendance
                ? 'border-primary-600 bg-primary-50/40 shadow-sm'
                : 'border-warm-200 hover:border-primary-300 hover:bg-warm-50/50'
            }`}
          >
            {form.showPresentInAttendance && (
              <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-primary-600 text-white flex items-center justify-center">
                <Check size={12} strokeWidth={3} />
              </div>
            )}
            <div className="flex items-center gap-2 mb-1.5">
              <Eye size={17} className={form.showPresentInAttendance ? 'text-primary-700' : 'text-gray-400'} />
              <h3 className="text-sm font-bold text-gray-800">Enable &ldquo;Present&rdquo;</h3>
            </div>
            <span className="inline-block text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-blue-100 text-blue-800 mb-2">
              Lengkap (4 Kolom)
            </span>
            <p className="text-xs text-gray-500 leading-relaxed">
              Kolom input <strong>Present</strong> muncul di halaman wali kelas dan ikut tampil pada tabel <em>Attendance Record</em> di output rapor (<em>Present, Unexcused, Sick, Excused</em>).
            </p>
          </div>
        </div>
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
                {form.semester1.month} {form.semester1.date ? `${form.semester1.date}, ` : ''}{form.semester1.year}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                <label className={labelCls}>Tanggal Cetak</label>
                <select
                  value={form.semester1.date || 20}
                  onChange={e => setForm(prev => ({
                    ...prev,
                    semester1: { ...prev.semester1, date: Number(e.target.value) }
                  }))}
                  className={inputCls}
                >
                  {dayOptions.map(d => (
                    <option key={d} value={d}>{d}</option>
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
                {form.semester2.month} {form.semester2.date ? `${form.semester2.date}, ` : ''}{form.semester2.year}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                <label className={labelCls}>Tanggal Cetak</label>
                <select
                  value={form.semester2.date || 20}
                  onChange={e => setForm(prev => ({
                    ...prev,
                    semester2: { ...prev.semester2, date: Number(e.target.value) }
                  }))}
                  className={inputCls}
                >
                  {dayOptions.map(d => (
                    <option key={d} value={d}>{d}</option>
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
              <h3 className="text-sm font-bold text-gray-800">Tanggal, Bulan & Tahun Tetap</h3>
              <p className="text-xs text-gray-400">Akan digunakan untuk seluruh dokumen rapor yang dicetak</p>
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-lg bg-primary-50 text-primary-700">
              {form.month} {form.date ? `${form.date}, ` : ''}{form.year}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-xl">
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
              <label className={labelCls}>Tanggal Cetak</label>
              <select
                value={form.date || new Date().getDate()}
                onChange={e => setForm(prev => ({ ...prev, date: Number(e.target.value) }))}
                className={inputCls}
              >
                {dayOptions.map(d => (
                  <option key={d} value={d}>{d}</option>
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
              Pada mode ini, tanggal, bulan dan tahun cetak akan selalu diperbarui secara otomatis mengikuti tanggal saat tombol
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
