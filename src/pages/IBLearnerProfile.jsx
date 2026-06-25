import { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Award, Save, CheckCircle2, Upload, Trash2, Plus, GripVertical, X } from 'lucide-react';

export default function IBLearnerProfile() {
  const { learnerProfiles, setLearnerProfiles, ibProfileLogo, setIbProfileLogo } = useApp();
  const [profiles, setProfiles] = useState(learnerProfiles.map((p, i) => ({ ...p, _id: i })));
  const [logo, setLogo] = useState(ibProfileLogo);
  const [saved, setSaved] = useState(false);
  const fileRef = useRef(null);

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { alert('File harus berupa gambar.'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => setLogo(ev.target.result);
    reader.readAsDataURL(file);
  };

  const removeLogo = () => setLogo(null);

  const updateProfile = (idx, field, value) => {
    setProfiles(prev => prev.map((p, i) => i === idx ? { ...p, [field]: value } : p));
  };

  const addProfile = () => {
    setProfiles(prev => [...prev, { name: '', description: '', _id: Date.now() }]);
  };

  const removeProfile = (idx) => {
    setProfiles(prev => prev.filter((_, i) => i !== idx));
  };

  const moveProfile = (idx, dir) => {
    setProfiles(prev => {
      const next = [...prev];
      const target = idx + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  };

  const handleSave = () => {
    const clean = profiles.map(({ _id, ...rest }) => rest);
    setLearnerProfiles(clean);
    setIbProfileLogo(logo);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const inputCls = 'w-full px-3 py-2.5 text-sm border border-warm-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400';
  const labelCls = 'block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5';

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 bg-primary-100 rounded-xl">
            <Award size={20} className="text-primary-700" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-primary-900">Profil Pembelajar IB</h1>
            <p className="text-sm text-gray-500">Kelola informasi IB Learner Profile yang tampil di halaman rapor.</p>
          </div>
        </div>
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-all duration-200 shadow-sm hover:shadow"
        >
          <Save size={16} /> Simpan
        </button>
      </div>

      {saved && (
        <div className="flex items-center gap-2 text-sm font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-4 py-2.5 rounded-lg">
          <CheckCircle2 size={16} /> Profil pembelajar berhasil disimpan.
        </div>
      )}

      {/* Logo Section */}
      <div className="bg-white rounded-xl border border-warm-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-warm-200 bg-warm-50/50">
          <h2 className="text-sm font-semibold text-gray-700">Logo IB Learner Profile</h2>
          <p className="text-xs text-gray-400 mt-0.5">Logo akan tampil di halaman rapor antara judul dan deskripsi IB Learner Profile.</p>
        </div>
        <div className="px-6 py-6 flex flex-col items-center gap-4">
          {logo ? (
            <div className="relative group">
              <img src={logo} alt="IB Learner Profile Logo" className="w-32 h-32 object-contain rounded-xl border border-warm-200 shadow-sm bg-white p-2" />
              <button
                onClick={removeLogo}
                className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full shadow-md hover:bg-red-600 transition-all opacity-0 group-hover:opacity-100"
                title="Hapus logo"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <div className="w-32 h-32 rounded-xl border-2 border-dashed border-warm-300 flex flex-col items-center justify-center text-gray-400 bg-warm-50/50">
              <Award size={32} className="mb-1 opacity-40" />
              <span className="text-[10px] font-medium">Belum ada logo</span>
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
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-700 bg-primary-50 hover:bg-primary-100 rounded-lg transition-all duration-200 border border-primary-200"
          >
            <Upload size={15} /> {logo ? 'Ganti Logo' : 'Upload Logo'}
          </button>
          <p className="text-[11px] text-gray-400">Format: PNG, JPG, SVG. Disarankan ukuran persegi.</p>
        </div>
      </div>

      {/* Profiles Section */}
      <div className="bg-white rounded-xl border border-warm-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-warm-200 bg-warm-50/50 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-gray-700">Daftar Profil Pembelajar</h2>
            <p className="text-xs text-gray-400 mt-0.5">{profiles.length} atribut profil pembelajar</p>
          </div>
          <button
            onClick={addProfile}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary-700 bg-primary-50 hover:bg-primary-100 rounded-lg transition-all duration-200 border border-primary-200"
          >
            <Plus size={14} /> Tambah
          </button>
        </div>

        <div className="divide-y divide-warm-100">
          {profiles.map((profile, idx) => (
            <div key={profile._id || idx} className="px-6 py-4 hover:bg-warm-50/30 transition-colors duration-100">
              <div className="flex items-start gap-3">
                {/* Drag handle + reorder */}
                <div className="flex flex-col items-center gap-1 pt-1 shrink-0">
                  <span className="flex items-center justify-center w-7 h-7 bg-primary-100 text-primary-700 rounded-full text-xs font-bold">
                    {idx + 1}
                  </span>
                  <div className="flex flex-col gap-0.5 mt-1">
                    <button
                      onClick={() => moveProfile(idx, -1)}
                      disabled={idx === 0}
                      className="p-0.5 text-gray-400 hover:text-primary-600 disabled:opacity-20 transition-colors"
                      title="Pindah ke atas"
                    >
                      <GripVertical size={12} className="rotate-90" />
                    </button>
                    <button
                      onClick={() => moveProfile(idx, 1)}
                      disabled={idx === profiles.length - 1}
                      className="p-0.5 text-gray-400 hover:text-primary-600 disabled:opacity-20 transition-colors"
                      title="Pindah ke bawah"
                    >
                      <GripVertical size={12} className="-rotate-90" />
                    </button>
                  </div>
                </div>

                {/* Form fields */}
                <div className="flex-1 space-y-2.5">
                  <div>
                    <label className={labelCls}>Nama Atribut</label>
                    <input
                      className={inputCls}
                      value={profile.name}
                      onChange={e => updateProfile(idx, 'name', e.target.value)}
                      placeholder="Contoh: Inquirers"
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Deskripsi</label>
                    <textarea
                      className={`${inputCls} resize-y min-h-[60px]`}
                      value={profile.description}
                      onChange={e => updateProfile(idx, 'description', e.target.value)}
                      placeholder="Deskripsi atribut profil pembelajar..."
                      rows={2}
                    />
                  </div>
                </div>

                {/* Delete */}
                <button
                  onClick={() => removeProfile(idx)}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all duration-200 shrink-0 mt-6"
                  title="Hapus atribut"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {profiles.length === 0 && (
          <div className="px-6 py-12 text-center text-gray-400 text-sm">
            Belum ada atribut profil pembelajar. Klik "Tambah" untuk menambahkan.
          </div>
        )}
      </div>
    </div>
  );
}
