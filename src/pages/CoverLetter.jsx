import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import {
  FileText, Save, RotateCcw, CheckCircle, Plus, Trash2,
  ArrowUp, ArrowDown, Eye, Upload, Info, Printer, Award, School
} from 'lucide-react';

export default function CoverLetter() {
  const { coverLetter, setCoverLetter, schoolProfile, activeYear, showToast, DEFAULT_COVER_LETTER } = useApp();

  const [form, setForm] = useState(() => ({
    ...DEFAULT_COVER_LETTER,
    ...(coverLetter || {}),
    paragraphs: coverLetter?.paragraphs && Array.isArray(coverLetter.paragraphs) && coverLetter.paragraphs.length > 0
      ? [...coverLetter.paragraphs]
      : [...DEFAULT_COVER_LETTER.paragraphs],
  }));

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const principalSigRef = useRef(null);
  const coordSigRef = useRef(null);

  // Sync when coverLetter from API loads
  useEffect(() => {
    if (coverLetter) {
      setForm({
        ...DEFAULT_COVER_LETTER,
        ...coverLetter,
        paragraphs: coverLetter.paragraphs && Array.isArray(coverLetter.paragraphs) && coverLetter.paragraphs.length > 0
          ? [...coverLetter.paragraphs]
          : [...DEFAULT_COVER_LETTER.paragraphs],
      });
    }
  }, [coverLetter, DEFAULT_COVER_LETTER]);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleParagraphChange = (index, value) => {
    setForm(prev => {
      const updated = [...prev.paragraphs];
      updated[index] = value;
      return { ...prev, paragraphs: updated };
    });
  };

  const addParagraph = () => {
    setForm(prev => ({
      ...prev,
      paragraphs: [...prev.paragraphs, ''],
    }));
  };

  const removeParagraph = (index) => {
    if (form.paragraphs.length <= 1) {
      showToast('error', 'Minimal harus ada 1 paragraf dalam surat pengantar.');
      return;
    }
    setForm(prev => ({
      ...prev,
      paragraphs: prev.paragraphs.filter((_, i) => i !== index),
    }));
  };

  const moveParagraph = (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= form.paragraphs.length) return;
    setForm(prev => {
      const updated = [...prev.paragraphs];
      const temp = updated[index];
      updated[index] = updated[targetIndex];
      updated[targetIndex] = temp;
      return { ...prev, paragraphs: updated };
    });
  };

  const handleSignatureUpload = (field, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('error', 'Format file tanda tangan harus berupa gambar (PNG/JPG/WebP). Disarankan PNG transparan.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      showToast('error', 'Ukuran gambar maksimal 2 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setForm(prev => ({ ...prev, [field]: reader.result }));
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const ok = await setCoverLetter(form);
      if (ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setForm({
      ...DEFAULT_COVER_LETTER,
      paragraphs: [...DEFAULT_COVER_LETTER.paragraphs],
    });
    showToast('info', 'Kata pengantar dikembalikan ke template standar MYP.');
  };

  const activeYearStr = activeYear?.year || '2025/2026';
  const inputCls = 'w-full px-3 py-2 text-sm border border-warm-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 bg-white';
  const labelCls = 'block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5';

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-11 h-11 bg-primary-100 rounded-xl text-primary-700 shadow-sm">
            <FileText size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-primary-900">Kata Pengantar Rapor</h1>
            <p className="text-sm text-gray-500">
              Kelola isi surat pengantar (Dear Parents) dan penandatangan pada halaman awal rapor siswa
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

      {/* Info Tip banner */}
      <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
        <Info size={18} className="text-blue-600 shrink-0 mt-0.5" />
        <div className="text-xs text-blue-900 space-y-1">
          <p className="font-semibold text-sm">Informasi Template Dinamis</p>
          <p className="leading-relaxed">
            Anda dapat menggunakan kode <code>{'{academicYear}'}</code> di dalam teks paragraf, yang akan otomatis digantikan
            dengan tahun ajaran aktif (saat ini: <strong>{activeYearStr}</strong>). Nama Kepala Sekolah dan Koordinator MYP diambil dari data{' '}
            <Link to="/pengaturan/profil-sekolah" className="text-blue-700 underline font-semibold hover:text-blue-800">
              Profil Sekolah
            </Link>.
          </p>
        </div>
      </div>

      {/* Section 1: Salutation & Opening */}
      <div className="bg-white rounded-xl border border-warm-200 shadow-sm p-6 space-y-4">
        <h2 className="text-base font-bold text-gray-800 border-b border-warm-100 pb-2">
          1. Salam Pembuka (Salutation &amp; Greeting)
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Sapaan Penerima (Salutation)</label>
            <input
              type="text"
              value={form.salutation || ''}
              onChange={e => handleChange('salutation', e.target.value)}
              placeholder="Dear Parents,"
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls}>Kalimat Salam (Greeting)</label>
            <input
              type="text"
              value={form.greeting || ''}
              onChange={e => handleChange('greeting', e.target.value)}
              placeholder="Assalamu’alaikum warahmatullahi wabarakatuh,"
              className={inputCls}
            />
          </div>
        </div>
      </div>

      {/* Section 2: Body Paragraphs */}
      <div className="bg-white rounded-xl border border-warm-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-warm-100 pb-2">
          <div>
            <h2 className="text-base font-bold text-gray-800">
              2. Paragraf Isi Surat Pengantar
            </h2>
            <p className="text-xs text-gray-500">
              {form.paragraphs.length} paragraf tercatat pada surat pengantar
            </p>
          </div>

          <button
            type="button"
            onClick={addParagraph}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-primary-700 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors"
          >
            <Plus size={14} />
            <span>Tambah Paragraf</span>
          </button>
        </div>

        <div className="space-y-4">
          {form.paragraphs.map((p, idx) => (
            <div key={idx} className="border border-warm-200 rounded-xl p-3.5 bg-warm-50/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-primary-800 bg-primary-100 px-2.5 py-0.5 rounded">
                  Paragraf {idx + 1}
                </span>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => moveParagraph(idx, -1)}
                    disabled={idx === 0}
                    className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-30 rounded hover:bg-warm-100"
                    title="Geser ke atas"
                  >
                    <ArrowUp size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveParagraph(idx, 1)}
                    disabled={idx === form.paragraphs.length - 1}
                    className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-30 rounded hover:bg-warm-100"
                    title="Geser ke bawah"
                  >
                    <ArrowDown size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeParagraph(idx)}
                    className="p-1 text-red-500 hover:text-red-700 rounded hover:bg-red-50 ml-1"
                    title="Hapus paragraf ini"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <textarea
                rows={3}
                value={p}
                onChange={e => handleParagraphChange(idx, e.target.value)}
                placeholder="Tuliskan isi paragraf..."
                className="w-full px-3 py-2 text-xs border border-warm-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 bg-white leading-relaxed"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Section 3: Closing & Signatures */}
      <div className="bg-white rounded-xl border border-warm-200 shadow-sm p-6 space-y-4">
        <h2 className="text-base font-bold text-gray-800 border-b border-warm-100 pb-2">
          3. Teks Penutup &amp; Penandatangan
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Salam Penutup (Closing Greeting)</label>
            <input
              type="text"
              value={form.closingGreeting || ''}
              onChange={e => handleChange('closingGreeting', e.target.value)}
              placeholder="Wassalamu’alaikum warahmatullahi wabarakatuh,"
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls}>Salam Hormat (Signoff)</label>
            <input
              type="text"
              value={form.closingSignoff || ''}
              onChange={e => handleChange('closingSignoff', e.target.value)}
              placeholder="Kind regards,"
              className={inputCls}
            />
          </div>
        </div>

        {/* Signatories Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-3">
          {/* Principal */}
          <div className="border border-warm-200 rounded-xl p-4 bg-warm-50/40 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-800">Penandatangan 1 (Kepala Sekolah)</span>
              <span className="text-[10px] text-gray-400">Kiri Bawah</span>
            </div>

            <div>
              <label className={labelCls}>Nama Kepala Sekolah</label>
              <div className="px-3 py-2 text-xs font-bold text-gray-800 bg-white border border-warm-200 rounded-lg">
                {schoolProfile?.principal || 'Belum diisi di Profil Sekolah'}
              </div>
            </div>

            <div>
              <label className={labelCls}>Label Jabatan</label>
              <input
                type="text"
                value={form.principalTitle || ''}
                onChange={e => handleChange('principalTitle', e.target.value)}
                placeholder="Principal"
                className={inputCls}
              />
            </div>

            <div>
              <label className={labelCls}>Tanda Tangan Digital (Opsional)</label>
              <div className="h-20 bg-white border border-gray-200 rounded-lg flex items-center justify-center p-2 mb-2">
                {form.principalSignature ? (
                  <img
                    src={form.principalSignature}
                    alt="Tanda Tangan Principal"
                    className="max-h-16 max-w-full object-contain"
                  />
                ) : (
                  <span className="text-[11px] text-gray-400 italic">
                    Belum ada tanda tangan (Tanda tangan basah)
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <label className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-primary-700 bg-white border border-primary-200 hover:bg-primary-50 rounded-lg cursor-pointer transition-colors">
                  <Upload size={13} />
                  <span>{form.principalSignature ? 'Ganti TTD' : 'Upload TTD'}</span>
                  <input
                    ref={principalSigRef}
                    type="file"
                    accept="image/*"
                    onChange={e => handleSignatureUpload('principalSignature', e)}
                    className="hidden"
                  />
                </label>
                {form.principalSignature && (
                  <button
                    type="button"
                    onClick={() => handleChange('principalSignature', null)}
                    className="p-1.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                    title="Hapus tanda tangan"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* MYP Coordinator */}
          <div className="border border-warm-200 rounded-xl p-4 bg-warm-50/40 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-800">Penandatangan 2 (Koordinator MYP)</span>
              <span className="text-[10px] text-gray-400">Kanan Bawah</span>
            </div>

            <div>
              <label className={labelCls}>Nama Koordinator MYP</label>
              <div className="px-3 py-2 text-xs font-bold text-gray-800 bg-white border border-warm-200 rounded-lg">
                {schoolProfile?.mypCoordinator || 'Belum diisi di Profil Sekolah'}
              </div>
            </div>

            <div>
              <label className={labelCls}>Label Jabatan</label>
              <input
                type="text"
                value={form.coordinatorTitle || ''}
                onChange={e => handleChange('coordinatorTitle', e.target.value)}
                placeholder="MYP Coordinator"
                className={inputCls}
              />
            </div>

            <div>
              <label className={labelCls}>Tanda Tangan Digital (Opsional)</label>
              <div className="h-20 bg-white border border-gray-200 rounded-lg flex items-center justify-center p-2 mb-2">
                {form.coordinatorSignature ? (
                  <img
                    src={form.coordinatorSignature}
                    alt="Tanda Tangan Koordinator"
                    className="max-h-16 max-w-full object-contain"
                  />
                ) : (
                  <span className="text-[11px] text-gray-400 italic">
                    Belum ada tanda tangan (Tanda tangan basah)
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <label className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-primary-700 bg-white border border-primary-200 hover:bg-primary-50 rounded-lg cursor-pointer transition-colors">
                  <Upload size={13} />
                  <span>{form.coordinatorSignature ? 'Ganti TTD' : 'Upload TTD'}</span>
                  <input
                    ref={coordSigRef}
                    type="file"
                    accept="image/*"
                    onChange={e => handleSignatureUpload('coordinatorSignature', e)}
                    className="hidden"
                  />
                </label>
                {form.coordinatorSignature && (
                  <button
                    type="button"
                    onClick={() => handleChange('coordinatorSignature', null)}
                    className="p-1.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                    title="Hapus tanda tangan"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section 4: Live Preview of Cover Letter (A4) */}
      <div className="bg-white rounded-xl border border-warm-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-warm-100 pb-2">
          <div className="flex items-center gap-2">
            <Eye size={18} className="text-primary-700" />
            <h2 className="text-base font-bold text-gray-800">
              Simulasi Tampilan Surat Pengantar (A4)
            </h2>
          </div>
          <span className="text-xs text-gray-400">Pratinjau persis halaman setelah cover</span>
        </div>

        <div className="bg-warm-50/90 border border-warm-200 rounded-xl p-4 sm:p-6 flex justify-center">
          <div
            className="bg-white border border-gray-300 shadow-md rounded-sm w-full max-w-[500px] p-6 sm:p-8 flex flex-col justify-between text-gray-800 text-[11px] leading-relaxed"
            style={{ minHeight: '620px', fontFamily: "'Montserrat', sans-serif" }}
          >
            {/* Letter Body */}
            <div className="space-y-2 text-justify text-gray-700">
              {form.salutation && (
                <p className="font-semibold text-gray-900">{form.salutation}</p>
              )}
              {form.greeting && (
                <p className="italic text-gray-600">{form.greeting}</p>
              )}
              {form.paragraphs.map((p, idx) => {
                const text = p
                  .replace(/\{academicYear\}/g, activeYearStr)
                  .replace(/\{studentName\}/g, 'ABRAHAM KENZIE PRIHANDOKO');
                return (
                  <p key={idx} className="leading-[1.6]">
                    {text}
                  </p>
                );
              })}
            </div>

            <div className="space-y-0.5 mt-4 text-gray-700">
              {form.closingGreeting && (
                <p className="italic text-gray-600">{form.closingGreeting}</p>
              )}
              {form.closingSignoff && (
                <p className="font-medium">{form.closingSignoff}</p>
              )}
            </div>

            {/* Signatures */}
            <div className="flex justify-between items-end mt-6 pt-2">
              <div className="text-center w-40">
                <div className="border-b border-gray-400 mb-1 h-14 relative flex items-end justify-center pb-0.5">
                  {form.principalSignature ? (
                    <img
                      src={form.principalSignature}
                      alt="TTD Principal"
                      className="max-h-12 max-w-full object-contain mb-0.5"
                    />
                  ) : null}
                </div>
                <p className="text-[10.5px] font-bold text-gray-800">{schoolProfile?.principal || 'Principal Name'}</p>
                <p className="text-[9.5px] text-gray-500">{form.principalTitle || 'Principal'}</p>
              </div>

              <div className="text-center w-40">
                <div className="border-b border-gray-400 mb-1 h-14 relative flex items-end justify-center pb-0.5">
                  {form.coordinatorSignature ? (
                    <img
                      src={form.coordinatorSignature}
                      alt="TTD Coordinator"
                      className="max-h-12 max-w-full object-contain mb-0.5"
                    />
                  ) : null}
                </div>
                <p className="text-[10.5px] font-bold text-gray-800">{schoolProfile?.mypCoordinator || 'Coordinator Name'}</p>
                <p className="text-[9.5px] text-gray-500">{form.coordinatorTitle || 'MYP Coordinator'}</p>
              </div>
            </div>
          </div>
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
          <span>Reset ke Template Default</span>
        </button>

        <div className="flex items-center gap-3">
          {saved && (
            <div className="flex items-center gap-1.5 text-emerald-600 text-xs font-semibold animate-fade-in">
              <CheckCircle size={15} />
              <span>Kata pengantar berhasil disimpan</span>
            </div>
          )}

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 active:bg-primary-800 rounded-xl shadow-sm hover:shadow transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save size={16} />
            <span>{saving ? 'Menyimpan...' : 'Simpan Kata Pengantar'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
