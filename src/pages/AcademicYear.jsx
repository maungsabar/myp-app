import { useState } from 'react';
import { useApp } from '../context/AppContext';
import api from '../services/api';
import { Calendar, Plus, CheckCircle, Zap } from 'lucide-react';
import DataTable from '../components/shared/DataTable';
import Modal from '../components/shared/Modal';
import ConfirmDialog from '../components/shared/ConfirmDialog';

export default function AcademicYear() {
  const { academicYears, setAcademicYears, showToast } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ year: '', semesters: [1, 2] });
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const handleAdd = async () => {
    if (!form.year) return;
    try {
      const created = await api.createAcademicYear({ year: form.year, activeSemester: 1, isActive: false });
      setAcademicYears(prev => [...prev, created]);
    } catch {
      setAcademicYears(prev => [...prev, { id: Date.now(), year: form.year, semesters: form.semesters, activeSemester: 1 }]);
    }
    setShowModal(false);
    setForm({ year: '', semesters: [1, 2] });
  };

  const setActive = async (id) => {
    setAcademicYears(prev => prev.map(y => ({ ...y, isActive: y.id === id })));
    try { await api.setActiveAcademicYear(id); } catch (err) { console.warn(err.message); }
  };

  const handleDelete = (row) => {
    if (row.isActive) return showToast('error', 'Tidak bisa menghapus tahun pelajaran yang sedang aktif.');
    setDeleteConfirm(row);
  };

  const columns = [
    { key: 'year', label: 'Tahun Pelajaran' },
    {
      key: 'activeSemester', label: 'Semester Aktif',
      render: (v) => <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-50 text-primary-700">Semester {v}</span>
    },
    {
      key: 'isActive', label: 'Status',
      render: (v) => v
        ? <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700"><CheckCircle size={12} />Aktif</span>
        : <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">Tidak Aktif</span>
    },
    {
      key: '_action', label: '', sortable: false,
      render: (_, row) => !row.isActive ? (
        <button onClick={() => setActive(row.id)}
          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gold-600 bg-gold-50 hover:bg-gold-100 rounded-lg transition-all duration-200">
          <Zap size={12} /> Set Aktif
        </button>
      ) : null
    },
  ];

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-primary-800">Tahun Pelajaran</h1>
        <p className="text-sm text-gray-500 mt-1">Kelola tahun ajaran dan semester aktif</p>
      </div>

      <DataTable
        title="Daftar Tahun Pelajaran"
        columns={columns}
        data={academicYears}
        onDelete={handleDelete}
        actions={
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-all duration-200">
            <Plus size={16} /> Tambah Tahun
          </button>
        }
      />

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Tambah Tahun Pelajaran" size="sm">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Tahun Pelajaran</label>
            <input type="text" value={form.year} onChange={e => setForm(prev => ({ ...prev, year: e.target.value }))}
              placeholder="Contoh: 2026/2027"
              className="w-full px-3 py-2.5 text-sm border border-warm-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400" />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-medium text-gray-600 bg-warm-100 hover:bg-warm-200 rounded-lg transition-all duration-200">Batal</button>
            <button onClick={handleAdd} className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-all duration-200">Simpan</button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={deleteConfirm !== null}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={async () => {
          setAcademicYears(prev => prev.filter(y => y.id !== deleteConfirm.id));
          try { await api.deleteAcademicYear(deleteConfirm.id); } catch (err) { console.warn(err.message); }
          setDeleteConfirm(null);
        }}
        title="Hapus Tahun Pelajaran"
        message={`Hapus tahun pelajaran "${deleteConfirm?.year}"?`}
        confirmText="Ya, Hapus"
        variant="danger"
      />
    </div>
  );
}
