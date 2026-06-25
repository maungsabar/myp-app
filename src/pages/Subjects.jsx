import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ALL_CRITERIA, CRITERIA_GRADE_LEVELS, getCriteriaCount } from '../data/dummyData';
import DataTable from '../components/shared/DataTable';
import Modal from '../components/shared/Modal';
import ConfirmDialog from '../components/shared/ConfirmDialog';
import { BookOpen, Plus } from 'lucide-react';

const CATEGORIES = [
  'Language and Literature',
  'Language Acquisition',
  'Mathematics',
  'Sciences',
  'Individuals and Societies',
  'Arts',
  'Physical and Health Education',
  'Design',
  'Community Project',
];

const defaultConfig = { 7: 4, 8: 4, 9: 4 };
const allGrades = [7, 8, 9];
const emptyForm = { name: '', category: CATEGORIES[0], shortName: '', criteriaConfig: { ...defaultConfig }, availableGrades: [...allGrades] };

export default function Subjects() {
  const { subjects, addSubject, updateSubject, deleteSubject, showToast } = useApp();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ ...emptyForm, criteriaConfig: { ...defaultConfig }, availableGrades: [...allGrades] });
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const openAdd = () => {
    setEditingId(null);
    setForm({ ...emptyForm, criteriaConfig: { ...defaultConfig }, availableGrades: [...allGrades] });
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setEditingId(row.id);
    const cc = row.criteriaConfig || {};
    setForm({
      name: row.name || '',
      category: row.category || CATEGORIES[0],
      shortName: row.shortName || '',
      criteriaConfig: {
        7: cc[7] ?? cc.default ?? row.criteriaCount ?? 4,
        8: cc[8] ?? cc.default ?? row.criteriaCount ?? 4,
        9: cc[9] ?? cc.default ?? row.criteriaCount ?? 4,
      },
      availableGrades: row.availableGrades ? [...row.availableGrades] : [...allGrades],
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.shortName) {
      showToast('error', 'Nama dan Nama Singkat wajib diisi.');
      return;
    }
    // Build criteriaConfig: only store grade-level overrides (different from default)
    const allSame = form.criteriaConfig[7] === form.criteriaConfig[8] && form.criteriaConfig[8] === form.criteriaConfig[9];
    const config = allSame && form.criteriaConfig[7] === 4
      ? null // all default, explicitly clear
      : (() => {
          const cfg = { default: form.criteriaConfig[7] };
          if (form.criteriaConfig[8] !== form.criteriaConfig[7]) cfg[8] = form.criteriaConfig[8];
          if (form.criteriaConfig[9] !== form.criteriaConfig[7]) cfg[9] = form.criteriaConfig[9];
          if (form.criteriaConfig[7] !== 4) cfg[7] = form.criteriaConfig[7];
          return cfg;
        })();

    const payload = { name: form.name, category: form.category, shortName: form.shortName, criteriaConfig: config };
    // Only store availableGrades if not all grades (default = all)
    if (form.availableGrades.length < 3) payload.availableGrades = form.availableGrades;
    else payload.availableGrades = null;

    try {
      if (editingId) {
        await updateSubject(editingId, payload);
        showToast('success', `Mata pelajaran "${form.name}" berhasil diperbarui.`);
      } else {
        const result = await addSubject(payload);
        if (result) showToast('success', `Mata pelajaran "${form.name}" berhasil ditambahkan.`);
      }
      setModalOpen(false);
    } catch (err) {
      showToast('error', `Gagal menyimpan: ${err.message}`);
    }
  };

  const categoryBadge = (cat) => {
    const colors = {
      'Language and Literature': 'bg-blue-50 text-blue-700',
      'Language Acquisition': 'bg-indigo-50 text-indigo-700',
      'Mathematics': 'bg-violet-50 text-violet-700',
      'Sciences': 'bg-emerald-50 text-emerald-700',
      'Individuals and Societies': 'bg-amber-50 text-amber-700',
      'Arts': 'bg-pink-50 text-pink-700',
      'Physical and Health Education': 'bg-orange-50 text-orange-700',
      'Design': 'bg-cyan-50 text-cyan-700',
      'Community Project': 'bg-teal-50 text-teal-700',
    };
    return (
      <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${colors[cat] || 'bg-gray-100 text-gray-600'}`}>
        {cat}
      </span>
    );
  };

  const columns = [
    { key: 'name', label: 'Nama Pelajaran' },
    { key: 'category', label: 'Kategori MYP', render: (val) => categoryBadge(val) },
    { key: 'shortName', label: 'Nama Singkat' },
    {
      key: 'id', label: 'Kriteria',
      render: (_val, row) => {
        const counts = CRITERIA_GRADE_LEVELS.map(g => getCriteriaCount(row, g));
        const allSame = counts.every(c => c === counts[0]);
        if (allSame) {
          const letters = ALL_CRITERIA.slice(0, counts[0]).join(', ');
          return (
            <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-primary-50 text-primary-700">
              {letters} <span className="ml-1 opacity-60">({counts[0]})</span>
            </span>
          );
        }
        return (
          <div className="flex gap-1">
            {CRITERIA_GRADE_LEVELS.map((g, i) => (
              <span key={g} className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium rounded ${counts[i] < 4 ? 'bg-amber-50 text-amber-700' : 'bg-primary-50 text-primary-600'}`}
                title={`Grade ${g}: ${ALL_CRITERIA.slice(0, counts[i]).join(', ')}`}>
                G{g}: {counts[i]}
              </span>
            ))}
          </div>
        );
      },
    },
  ];

  const inputCls = 'w-full px-3 py-2 text-sm border border-warm-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400';
  const labelCls = 'block text-sm font-medium text-gray-700 mb-1';

  return (
    <div className="space-y-4">
      <DataTable
        title="Mata Pelajaran MYP"
        columns={columns}
        data={subjects}
        onEdit={openEdit}
        onDelete={(row) => setDeleteConfirm(row)}
        actions={
          <button onClick={openAdd} className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-all duration-200 flex items-center gap-2">
            <Plus size={16} /> Tambah Mapel
          </button>
        }
      />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Edit Mata Pelajaran' : 'Tambah Mata Pelajaran'}>
        <div className="space-y-4">
          <div>
            <label className={labelCls}>Nama Mata Pelajaran</label>
            <input className={inputCls} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Contoh: Mathematics" />
          </div>
          <div>
            <label className={labelCls}>Kategori MYP</label>
            <select className={inputCls} value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Nama Singkat</label>
            <input className={inputCls} value={form.shortName} onChange={e => setForm(f => ({ ...f, shortName: e.target.value }))} placeholder="Contoh: Math" />
          </div>
          <div>
            <label className={labelCls}>Tersedia di Tingkat Kelas</label>
            <div className="flex gap-2">
              {allGrades.map(g => {
                const isActive = form.availableGrades.includes(g);
                return (
                  <button
                    key={g}
                    type="button"
                    onClick={() => {
                      setForm(f => {
                        const has = f.availableGrades.includes(g);
                        const next = has ? f.availableGrades.filter(x => x !== g) : [...f.availableGrades, g].sort();
                        return { ...f, availableGrades: next.length > 0 ? next : f.availableGrades };
                      });
                    }}
                    className={`flex-1 py-2 text-sm font-semibold rounded-lg border-2 transition-all duration-200 ${
                      isActive
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-warm-200 bg-white text-gray-400 hover:border-warm-300 line-through'
                    }`}
                  >
                    Grade {g}
                  </button>
                );
              })}
            </div>
            {form.availableGrades.length < 3 && (
              <p className="mt-1.5 text-[11px] text-amber-600 font-medium">
                Mapel ini hanya tersedia di kelas: {form.availableGrades.map(g => `Grade ${g}`).join(', ')}
              </p>
            )}
          </div>
          <div>
            <label className={labelCls}>Jumlah Kriteria per Tingkat Kelas</label>
            <div className="space-y-2.5">
              {CRITERIA_GRADE_LEVELS.map(grade => {
                const isAvailable = form.availableGrades.includes(grade);
                const currentCount = form.criteriaConfig[grade] || 4;
                return (
                  <div key={grade} className={`flex items-center gap-3 ${!isAvailable ? 'opacity-30 pointer-events-none' : ''}`}>
                    <span className="text-xs font-medium text-gray-500 w-16 shrink-0">Grade {grade}</span>
                    <div className="flex gap-1.5 flex-1">
                      {[1, 2, 3, 4].map(n => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setForm(f => ({
                            ...f,
                            criteriaConfig: { ...f.criteriaConfig, [grade]: n },
                          }))}
                          className={`flex-1 py-1.5 text-xs font-semibold rounded-md border transition-all duration-200 ${
                            currentCount === n
                              ? 'border-primary-500 bg-primary-50 text-primary-700'
                              : 'border-warm-200 bg-white text-gray-400 hover:border-warm-300'
                          }`}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center gap-0.5 w-24 shrink-0">
                      {ALL_CRITERIA.slice(0, currentCount).map(letter => (
                        <span key={letter} className="inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold rounded bg-primary-100 text-primary-700">
                          {letter}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
            {(() => {
              const counts = CRITERIA_GRADE_LEVELS.map(g => form.criteriaConfig[g]);
              const hasDiff = !counts.every(c => c === counts[0]);
              return hasDiff ? (
                <p className="mt-2 text-[11px] text-amber-600 font-medium">
                  Catatan: Jumlah kriteria berbeda antar tingkat kelas.
                </p>
              ) : null;
            })()}
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-warm-200">
          <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-600 bg-warm-100 hover:bg-warm-200 rounded-lg transition-all duration-200">Batal</button>
          <button onClick={handleSave} className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-all duration-200">{editingId ? 'Simpan Perubahan' : 'Tambah Mapel'}</button>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={deleteConfirm !== null}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => {
          deleteSubject(deleteConfirm.id);
          setDeleteConfirm(null);
        }}
        title="Hapus Mata Pelajaran"
        message={`Hapus mata pelajaran "${deleteConfirm?.name}"?`}
        confirmText="Ya, Hapus"
        variant="danger"
      />
    </div>
  );
}
