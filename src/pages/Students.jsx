import { useState } from 'react';
import { useApp } from '../context/AppContext';
import DataTable from '../components/shared/DataTable';
import Modal from '../components/shared/Modal';
import ConfirmDialog from '../components/shared/ConfirmDialog';
import ImportModal from '../components/shared/ImportModal';
import { UserPlus, FileDown, Trash2 } from 'lucide-react';

const CLASS_OPTIONS = ['7A', '7B', '8A', '8B', '9A', '9B'];

const emptyForm = {
  nis: '', name: '', class: '7A', gender: 'L', birthDate: '', parentEmail: '', status: 'active',
};

export default function Students() {
  const { students, addStudent, updateStudent, deleteStudent, bulkDeleteStudents, showToast } = useApp();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [importOpen, setImportOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);

  const importColumns = [
    { key: 'nis', header: 'NISN', required: true, sample: '0112301194' },
    { key: 'name', header: 'Nama Lengkap', required: true, sample: 'Ahmad Fauzi' },
    { key: 'class', header: 'Kelas', required: true, sample: '7A', validate: (v) => CLASS_OPTIONS.includes(v), transform: (v) => v?.toUpperCase() },
    { key: 'gender', header: 'Gender', required: true, sample: 'L', validate: (v) => ['L', 'P'].includes(v?.toUpperCase()), transform: (v) => v?.toUpperCase() },
    { key: 'birthDate', header: 'Tanggal Lahir', sample: '2012-05-15', transform: (v) => v || '' },
    { key: 'parentEmail', header: 'Email Orang Tua', sample: 'parent@email.com', validate: (v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), transform: (v) => v || '' },
    { key: 'status', header: 'Status', sample: 'active', validate: (v) => ['active', 'inactive'].includes(v?.toLowerCase()), transform: (v) => v?.toLowerCase() || 'active' },
  ];

  const handleImport = async (rows) => {
    let successCount = 0;
    for (const row of rows) {
      const result = await addStudent({
        nis: row.nis,
        name: row.name,
        class: row.class || '7A',
        gender: row.gender || 'L',
        birthDate: row.birthDate || '',
        parentEmail: row.parentEmail || '',
        status: row.status || 'active',
      });
      if (result) successCount++;
    }
    if (successCount > 0) showToast('success', `${successCount} dari ${rows.length} siswa berhasil diimpor.`);
  };

  const openAdd = () => {
    setEditingId(null);
    setForm({ ...emptyForm });
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setEditingId(row.id);
    setForm({
      nis: row.nis || '',
      name: row.name || '',
      class: row.class || '7A',
      gender: row.gender || 'L',
      birthDate: row.birthDate || '',
      parentEmail: row.parentEmail || '',
      status: row.status || 'active',
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.nis || !form.name) {
      showToast('error', 'NISN dan Nama wajib diisi.');
      return;
    }
    try {
      if (editingId) {
        await updateStudent(editingId, form);
        showToast('success', `Data siswa "${form.name}" berhasil diperbarui.`);
      } else {
        const result = await addStudent(form);
        if (result) showToast('success', `Siswa "${form.name}" berhasil ditambahkan.`);
      }
      setModalOpen(false);
    } catch (err) {
      showToast('error', `Gagal menyimpan data: ${err.message}`);
    }
  };

  const columns = [
    { key: 'nis', label: 'NISN' },
    { key: 'name', label: 'Nama' },
    { key: 'class', label: 'Kelas' },
    {
      key: 'gender',
      label: 'Gender',
      render: (val) =>
        val === 'L'
          ? <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-blue-50 text-blue-700">Laki-laki</span>
          : <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-pink-50 text-pink-700">Perempuan</span>,
    },
    {
      key: 'status',
      label: 'Status',
      render: (val) =>
        val === 'active'
          ? <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-emerald-50 text-emerald-700">Aktif</span>
          : <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-500">Nonaktif</span>,
    },
  ];

  const inputCls = 'w-full px-3 py-2 text-sm border border-warm-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400';
  const labelCls = 'block text-sm font-medium text-gray-700 mb-1';

  return (
    <div className="space-y-4">
      <DataTable
        title="Data Siswa"
        columns={columns}
        data={students}
        onEdit={openEdit}
        onDelete={(row) => setDeleteConfirm(row)}
        selectable
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        bulkActions={
          <button
            onClick={() => setBulkDeleteConfirm(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-all duration-200 border border-red-200"
          >
            <Trash2 size={14} /> Hapus yang Dipilih
          </button>
        }
        actions={
          <div className="flex items-center gap-2">
            <button onClick={() => setImportOpen(true)} className="px-4 py-2 text-sm font-medium text-primary-700 bg-primary-50 hover:bg-primary-100 rounded-lg transition-all duration-200 flex items-center gap-2">
              <FileDown size={16} /> Impor
            </button>
            <button onClick={openAdd} className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-all duration-200 flex items-center gap-2">
              <UserPlus size={16} /> Tambah Siswa
            </button>
          </div>
        }
      />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Edit Siswa' : 'Tambah Siswa'} size="lg">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>NISN</label>
            <input className={inputCls} value={form.nis} onChange={e => setForm(f => ({ ...f, nis: e.target.value.replace(/\D/g, '') }))} placeholder="Nomor Induk Siswa Nasional" />
          </div>
          <div>
            <label className={labelCls}>Nama Lengkap</label>
            <input className={inputCls} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Nama siswa" />
          </div>
          <div>
            <label className={labelCls}>Kelas</label>
            <select className={inputCls} value={form.class} onChange={e => setForm(f => ({ ...f, class: e.target.value }))}>
              {CLASS_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Gender</label>
            <div className="flex items-center gap-4 mt-2">
              <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                <input type="radio" name="gender" value="L" checked={form.gender === 'L'} onChange={e => setForm(f => ({ ...f, gender: e.target.value }))} className="text-primary-600 focus:ring-primary-500" />
                Laki-laki
              </label>
              <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                <input type="radio" name="gender" value="P" checked={form.gender === 'P'} onChange={e => setForm(f => ({ ...f, gender: e.target.value }))} className="text-primary-600 focus:ring-primary-500" />
                Perempuan
              </label>
            </div>
          </div>
          <div>
            <label className={labelCls}>Tanggal Lahir</label>
            <input type="date" className={inputCls} value={form.birthDate} onChange={e => setForm(f => ({ ...f, birthDate: e.target.value }))} />
          </div>
          <div>
            <label className={labelCls}>Email Orang Tua</label>
            <input type="email" className={inputCls} value={form.parentEmail} onChange={e => setForm(f => ({ ...f, parentEmail: e.target.value }))} placeholder="parent@email.com" />
          </div>
          <div>
            <label className={labelCls}>Status</label>
            <select className={inputCls} value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
              <option value="active">Aktif</option>
              <option value="inactive">Nonaktif</option>
            </select>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-warm-200">
          <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-600 bg-warm-100 hover:bg-warm-200 rounded-lg transition-all duration-200">Batal</button>
          <button onClick={handleSave} className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-all duration-200">{editingId ? 'Simpan Perubahan' : 'Tambah Siswa'}</button>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={deleteConfirm !== null}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => {
          deleteStudent(deleteConfirm.id);
          setDeleteConfirm(null);
        }}
        title="Hapus Siswa"
        message={`Hapus siswa "${deleteConfirm?.name}"?`}
        confirmText="Ya, Hapus"
        variant="danger"
      />

      <ConfirmDialog
        isOpen={bulkDeleteConfirm}
        onClose={() => setBulkDeleteConfirm(false)}
        onConfirm={async () => {
          const ids = Array.from(selectedIds);
          const result = await bulkDeleteStudents(ids);
          if (result) {
            showToast('success', `${result.deletedCount} siswa berhasil dihapus.`);
            setSelectedIds(new Set());
          }
          setBulkDeleteConfirm(false);
        }}
        title="Hapus Massal Siswa"
        message={`Anda yakin ingin menghapus ${selectedIds.size} siswa yang dipilih? Tindakan ini tidak dapat dibatalkan.`}
        confirmText="Ya, Hapus Semua"
        variant="danger"
      />

      <ImportModal
        isOpen={importOpen}
        onClose={() => setImportOpen(false)}
        onImport={handleImport}
        title="Impor Data Siswa"
        columns={importColumns}
        templateName="Template_Impor_Siswa"
      />
    </div>
  );
}
