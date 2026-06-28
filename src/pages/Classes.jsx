import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Plus, Users, Layers, Trash2, Edit2, Check, X, Hash, Type, Sparkles } from 'lucide-react';
import DataTable from '../components/shared/DataTable';
import Modal from '../components/shared/Modal';
import ConfirmDialog from '../components/shared/ConfirmDialog';

const LEVELS = [7, 8, 9];
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export default function Classes() {
  const { classes, setClasses, addClass, updateClass, deleteClass, teachers, students } = useApp();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [editClass, setEditClass] = useState(null);
  const [form, setForm] = useState({ name: '', level: 7, suffix: 'A', homeroomTeacherId: null, capacity: 30 });

  // Bulk form
  const [bulk, setBulk] = useState({ level: 7, type: 'letter', startFrom: 'A', count: 2 });
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const homeroomTeachers = teachers.filter(t => t.role === 'homeroom');

  const inputCls = 'w-full px-3 py-2 text-sm border border-warm-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400';
  const labelCls = 'block text-sm font-medium text-gray-700 mb-1';

  const getStudentCount = (className) => students.filter(s => s.class === className && s.status === 'active').length;

  // ── Add single ──
  const openAdd = () => {
    setEditClass(null);
    setForm({ name: '', level: 7, suffix: 'A', homeroomTeacherId: null, capacity: 30 });
    setShowAddModal(true);
  };

  const openEdit = (row) => {
    setEditClass(row);
    setForm({ name: row.name, level: row.level, suffix: row.suffix, homeroomTeacherId: row.homeroomTeacherId, capacity: row.capacity });
    setShowAddModal(true);
  };

  const handleSave = () => {
    const name = form.name || `${form.level}${form.suffix}`;
    if (editClass) {
      updateClass(editClass.id, { ...form, name });
    } else {
      // Check duplicate
      if (classes.some(c => c.name === name)) {
        return alert(`Kelas "${name}" sudah ada.`);
      }
      addClass({ ...form, name });
    }
    setShowAddModal(false);
  };

  const handleDelete = (row) => {
    const count = getStudentCount(row.name);
    if (count > 0) return alert(`Tidak bisa hapus kelas "${row.name}" karena masih memiliki ${count} siswa.`);
    setDeleteConfirm(row);
  };

  // ── Bulk add ──
  const generateBulkPreview = () => {
    const result = [];
    for (let i = 0; i < bulk.count; i++) {
      let suffix;
      if (bulk.type === 'letter') {
        const startIdx = LETTERS.indexOf(bulk.startFrom.toUpperCase());
        suffix = LETTERS[startIdx + i] || String.fromCharCode(65 + startIdx + i);
      } else {
        suffix = String(parseInt(bulk.startFrom) + i);
      }
      result.push({ name: `${bulk.level}${suffix}`, level: bulk.level, suffix });
    }
    return result;
  };

  const handleBulkAdd = () => {
    const preview = generateBulkPreview();
    const duplicates = preview.filter(p => classes.some(c => c.name === p.name));
    if (duplicates.length > 0) {
      return alert(`Kelas berikut sudah ada: ${duplicates.map(d => d.name).join(', ')}. Sesuaikan parameter.`);
    }
    preview.forEach(p => {
      addClass({ ...p, homeroomTeacherId: null, capacity: 30 });
    });
    setShowBulkModal(false);
    setBulk({ level: 7, type: 'letter', startFrom: 'A', count: 2 });
  };

  // ── Table columns ──
  const columns = [
    {
      key: 'name', label: 'Nama Kelas',
      render: (v) => <span className="font-semibold text-primary-700">{v}</span>
    },
    {
      key: 'level', label: 'Tingkat',
      render: (v) => <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-warm-100 text-gray-600">Kelas {v}</span>
    },
    {
      key: 'homeroomTeacherId', label: 'Wali Kelas',
      render: (v) => {
        const t = teachers.find(t => t.id === v);
        return t
          ? <span className="text-sm text-gray-700">{t.name}</span>
          : <span className="text-xs text-gray-400 italic">Belum ditentukan</span>;
      }
    },
    {
      key: 'name', label: 'Jumlah Siswa', sortable: false,
      render: (v) => {
        const count = getStudentCount(v);
        return (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">{count}</span>
            <span className="text-xs text-gray-400">siswa</span>
          </div>
        );
      }
    },
    {
      key: 'capacity', label: 'Kapasitas',
      render: (v) => <span className="text-sm text-gray-600">{v}</span>
    },
  ];

  const bulkPreview = bulk.count > 0 && bulk.count <= 20 ? generateBulkPreview() : [];

  return (
    <div className="animate-fade-in">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-primary-800">Data Kelas</h1>
          <p className="text-sm text-gray-500 mt-1">Kelola data kelas dan penetapan wali kelas</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowBulkModal(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-700 bg-primary-50 hover:bg-primary-100 rounded-lg transition-all duration-200 border border-primary-200">
            <Sparkles size={16} /> Tambah Kolektif
          </button>
          <button onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-all duration-200">
            <Plus size={16} /> Tambah Kelas
          </button>
        </div>
      </div>

      {/* Stats per level */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {LEVELS.map(level => {
          const levelClasses = classes.filter(c => c.level === level);
          const totalStudents = levelClasses.reduce((sum, c) => sum + getStudentCount(c.name), 0);
          return (
            <div key={level} className="bg-white rounded-xl border border-warm-200 shadow-sm p-4 flex items-center gap-4">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0
                ${level === 7 ? 'bg-blue-50 text-blue-600' : level === 8 ? 'bg-emerald-50 text-emerald-600' : 'bg-purple-50 text-purple-600'}`}>
                <Layers size={20} />
              </div>
              <div>
                <p className="text-sm font-semibold text-primary-800">Kelas {level}</p>
                <p className="text-xs text-gray-400">{levelClasses.length} kelas · {totalStudents} siswa</p>
              </div>
            </div>
          );
        })}
      </div>

      <DataTable
        title="Daftar Kelas"
        columns={columns}
        data={classes}
        onEdit={openEdit}
        onDelete={handleDelete}
      />

      {/* ── Add / Edit Modal ── */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title={editClass ? 'Edit Kelas' : 'Tambah Kelas'} size="lg">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className={labelCls}>Nama Kelas</label>
            <input type="text" className={inputCls} value={form.name} onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Contoh: 8A" />
            <p className="text-[11px] text-gray-400 mt-1">Kosongkan untuk generate otomatis dari tingkat + akhiran</p>
          </div>
          <div>
            <label className={labelCls}>Tingkat</label>
            <select className={inputCls} value={form.level} onChange={e => setForm(prev => ({ ...prev, level: Number(e.target.value) }))}>
              {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Akhiran</label>
            <input type="text" className={inputCls} value={form.suffix} onChange={e => setForm(prev => ({ ...prev, suffix: e.target.value }))}
              maxLength={3} />
          </div>
          <div>
            <label className={labelCls}>Wali Kelas</label>
            <select className={inputCls} value={form.homeroomTeacherId || ''} onChange={e => setForm(prev => ({ ...prev, homeroomTeacherId: e.target.value ? Number(e.target.value) : null }))}>
              <option value="">— Belum ditentukan —</option>
              {homeroomTeachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Kapasitas</label>
            <input type="number" className={inputCls} value={form.capacity} onChange={e => setForm(prev => ({ ...prev, capacity: Number(e.target.value) }))} />
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-warm-200">
          <button onClick={() => setShowAddModal(false)} className="px-4 py-2 text-sm font-medium text-gray-600 bg-warm-100 hover:bg-warm-200 rounded-lg transition-all duration-200">Batal</button>
          <button onClick={handleSave} className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-all duration-200">Simpan</button>
        </div>
      </Modal>

      {/* ── Bulk Add Modal ── */}
      <Modal isOpen={showBulkModal} onClose={() => setShowBulkModal(false)} title="Tambah Kelas Kolektif" size="lg">
        <div className="space-y-5">
          <p className="text-sm text-gray-500">Buat beberapa kelas sekaligus berdasarkan parameter di bawah.</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Tingkat</label>
              <select className={inputCls} value={bulk.level} onChange={e => setBulk(prev => ({ ...prev, level: Number(e.target.value) }))}>
                {LEVELS.map(l => <option key={l} value={l}>Kelas {l}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Jenis Nama Kelas</label>
              <div className="flex gap-2">
                <button onClick={() => setBulk(prev => ({ ...prev, type: 'letter', startFrom: 'A' }))}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border transition-all duration-200
                    ${bulk.type === 'letter' ? 'bg-primary-50 border-primary-300 text-primary-700' : 'bg-warm-50 border-warm-200 text-gray-500 hover:bg-warm-100'}`}>
                  <Type size={14} /> Huruf
                </button>
                <button onClick={() => setBulk(prev => ({ ...prev, type: 'number', startFrom: '1' }))}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border transition-all duration-200
                    ${bulk.type === 'number' ? 'bg-primary-50 border-primary-300 text-primary-700' : 'bg-warm-50 border-warm-200 text-gray-500 hover:bg-warm-100'}`}>
                  <Hash size={14} /> Angka
                </button>
              </div>
            </div>
            <div>
              <label className={labelCls}>Mulai Dari</label>
              {bulk.type === 'letter' ? (
                <select className={inputCls} value={bulk.startFrom} onChange={e => setBulk(prev => ({ ...prev, startFrom: e.target.value }))}>
                  {LETTERS.split('').map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              ) : (
                <input type="number" className={inputCls} value={bulk.startFrom} onChange={e => setBulk(prev => ({ ...prev, startFrom: e.target.value }))} min={1} />
              )}
            </div>
            <div>
              <label className={labelCls}>Jumlah Kelas</label>
              <input type="number" className={inputCls} value={bulk.count} onChange={e => setBulk(prev => ({ ...prev, count: Math.max(1, Number(e.target.value)) }))} min={1} max={20} />
            </div>
          </div>

          {/* Preview */}
          {bulkPreview.length > 0 && (
            <div className="bg-warm-50 rounded-xl border border-warm-200 p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Preview kelas yang akan dibuat</p>
              <div className="flex flex-wrap gap-2">
                {bulkPreview.map((p, i) => {
                  const exists = classes.some(c => c.name === p.name);
                  return (
                    <span key={i} className={`inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-semibold border
                      ${exists ? 'bg-red-50 border-red-200 text-red-600 line-through' : 'bg-white border-primary-200 text-primary-700'}`}>
                      {p.name}
                      {exists && <span className="ml-1.5 text-[10px] font-normal no-underline">(duplikat)</span>}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-warm-200">
            <button onClick={() => setShowBulkModal(false)} className="px-4 py-2 text-sm font-medium text-gray-600 bg-warm-100 hover:bg-warm-200 rounded-lg transition-all duration-200">Batal</button>
            <button onClick={handleBulkAdd}
              className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-all duration-200">
              <Sparkles size={14} /> Buat {bulkPreview.length} Kelas
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={deleteConfirm !== null}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => { deleteClass(deleteConfirm.id); setDeleteConfirm(null); }}
        title="Hapus Kelas"
        message={`Hapus kelas "${deleteConfirm?.name}"?`}
        confirmText="Ya, Hapus"
        variant="danger"
      />
    </div>
  );
}
