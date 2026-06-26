import { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { School, Save, CheckCircle, Upload, X } from 'lucide-react';

export default function SchoolProfilePage() {
  const { schoolProfile, setSchoolProfile, activeYear, getSemesterLabel, showToast } = useApp();
  const [form, setForm] = useState({ ...schoolProfile });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const fileRef = useRef(null);

  // Sync form when schoolProfile changes (e.g., after API data loads)
  useEffect(() => {
    setForm(prev => ({ ...prev, ...schoolProfile }));
  }, [schoolProfile]);

  const handleChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { showToast('error', 'File harus berupa gambar.'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => setForm(prev => ({ ...prev, logo: ev.target.result }));
    reader.readAsDataURL(file);
  };

  const removeLogo = () => setForm(prev => ({ ...prev, logo: null }));

  const handleSave = async () => {
    setSaving(true);
    try {
      // Only send fields that exist in the database schema
      const { id, academicYear, semester, ...payload } = form;
      const success = await setSchoolProfile(payload);
      if (success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } finally {
      setSaving(false);
    }
  };

  const inputCls = 'w-full px-3 py-2.5 text-sm border border-warm-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400';
  const labelCls = 'block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5';

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-primary-800">Profil Sekolah</h1>
        <p className="text-sm text-gray-500 mt-1">Kelola informasi dan identitas lembaga sekolah</p>
      </div>

      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl border border-warm-200 shadow-sm overflow-hidden">
          {/* Logo Area */}
          <div className="px-6 py-8 bg-gradient-to-br from-primary-50 to-warm-50 border-b border-warm-200 flex flex-col items-center">
            {form.logo ? (
              <div className="relative group mb-3">
                <img src={form.logo} alt="Logo Sekolah" className="w-24 h-24 object-contain rounded-xl border border-warm-200 shadow-sm bg-white p-2" />
                <button
                  onClick={removeLogo}
                  className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full shadow-md hover:bg-red-600 transition-all opacity-0 group-hover:opacity-100"
                  title="Hapus logo"
                >
                  <X size={12} />
                </button>
              </div>
            ) : (
              <div className="w-24 h-24 rounded-2xl bg-primary-700 flex items-center justify-center shadow-lg mb-3">
                <School size={40} className="text-gold-400" />
              </div>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              className="hidden"
            />
            <button
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary-700 bg-primary-50 hover:bg-primary-100 rounded-lg transition-all duration-200 border border-primary-200"
            >
              <Upload size={13} /> {form.logo ? 'Ganti Logo' : 'Upload Logo'}
            </button>
            <p className="text-[10px] text-gray-400 mt-1.5">Format: PNG, JPG. Disarankan ukuran persegi.</p>
          </div>

          {/* Form */}
          <div className="p-6 space-y-5">
            <div>
              <label className={labelCls}>Nama Sekolah</label>
              <input type="text" value={form.name} onChange={e => handleChange('name', e.target.value)}
                className={inputCls} />
            </div>

            <div>
              <label className={labelCls}>Alamat</label>
              <textarea value={form.address} onChange={e => handleChange('address', e.target.value)} rows={3}
                className={`${inputCls} resize-none`} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Telepon</label>
                <input type="text" value={form.phone} onChange={e => handleChange('phone', e.target.value)}
                  className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Email</label>
                <input type="email" value={form.email} onChange={e => handleChange('email', e.target.value)}
                  className={inputCls} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Kepala Sekolah</label>
                <input type="text" value={form.principal} onChange={e => handleChange('principal', e.target.value)}
                  className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Koordinator MYP</label>
                <input type="text" value={form.mypCoordinator} onChange={e => handleChange('mypCoordinator', e.target.value)}
                  className={inputCls} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Tahun Ajaran</label>
                <input type="text" value={activeYear?.year || '-'} disabled
                  className={`${inputCls} bg-warm-50 text-gray-500`} />
              </div>
              <div>
                <label className={labelCls}>Semester</label>
                <input type="text" value={getSemesterLabel(activeYear, activeYear?.activeSemester || 1)} disabled
                  className={`${inputCls} bg-warm-50 text-gray-500`} />
              </div>
            </div>

            {/* Save */}
            <div className="pt-4 border-t border-warm-100 flex items-center justify-between">
              {saved ? (
                <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
                  <CheckCircle size={16} /> Profil berhasil disimpan
                </div>
              ) : <div />}
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-all duration-200 shadow-sm hover:shadow disabled:opacity-50 disabled:cursor-not-allowed">
                <Save size={16} /> {saving ? 'Menyimpan...' : 'Simpan Profil'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
