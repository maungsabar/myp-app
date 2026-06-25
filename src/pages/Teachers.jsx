import { useState } from 'react';
import { useApp } from '../context/AppContext';
import DataTable from '../components/shared/DataTable';
import Modal from '../components/shared/Modal';
import ConfirmDialog from '../components/shared/ConfirmDialog';
import ImportModal from '../components/shared/ImportModal';
import { UserPlus, FileDown } from 'lucide-react';

const emptyForm = {
  nip: '', name: '', role: 'subject', homeroom: '', email: '',
};

export default function Teachers() {
  const { teachers, addTeacher, updateTeacher, deleteTeacher, showToast } = useApp();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [importOpen, setImportOpen] = useState(false);

  const importColumns = [
    { key: 'nip', header: 'NIP', required: true, sample: '198501012010011001' },
    { key: 'name', header: 'Nama Lengkap', required: true, sample: 'Budi Santoso, S.Pd.' },
    { key: 'role', header: 'Role', required: true, sample: 'subject', validate: (v) => ['admin', 'homeroom', 'subject'].includes(v?.toLowerCase()), transform: (v) => v?.toLowerCase() || 'subject' },
    { key: 'email', header: 'Email', sample: 'budi@school.id', validate: (v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), transform: (v) => v || '' },
  ];

  const handleImport = async (rows) => {
    let successCount = 0;
    for (const row of rows) {
      const result = await addTeacher({
        nip: row.nip,
        name: row.name,
        role: row.role || 'subject',
        email: row.email || '',
      });
      if (result) successCount++;
    }
    if (successCount > 0) showToast('success', `${successCount} dari ${rows.length} guru berhasil diimpor.`);
  };

  const openAdd = () => {
    setEditingId(null);
    setForm({ ...emptyForm });
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setEditingId(row.id);
    setForm({
      nip: row.nip || '',
      name: row.name || '',
      role: row.role || 'subject',
      homeroom: row.homeroom || '',
      email: row.email || '',
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.nip || !form.name) {
      showToast('error', 'NIP dan Nama wajib diisi.');
      return;
    }
    const data = { ...form };
    if (data.role !== 'homeroom') data.homeroom = null;
    try {
      if (editingId) {
        await updateTeacher(editingId, data);
        showToast('success', `Data guru "${form.name}" berhasil diperbarui.`);
      } else {
        const result = await addTeacher(data);
        if (result) showToast('success', `Guru "${form.name}" berhasil ditambahkan.`);
      }
      setModalOpen(false);
    } catch (err) {
      showToast('error', `Gagal menyimpan data: ${err.message}`);
    }
  };

  const roleBadge = (role) => {
    switch (role) {
      case 'admin':
        return <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-primary-50 text-primary-700">Admin</span>;
      case 'homeroom':
        return <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-gold-50 text-gold-600">Wali Kelas</span>;
      default:
        return <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-600">Guru Mapel</span>;
    }
  };

  const columns = [
    { key: 'nip', label: 'NIP' },
    { key: 'name', label: 'Nama' },
    { key: 'role', label: 'Role', render: (val) => roleBadge(val) },
    {
      key: 'homeroom',
      label: 'Homeroom',
      render: (val) => val
        ? <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-primary-50 text-primary-700">{val}</span>
        : <span className="text-gray-400">-</span>,
    },
    { key: 'email', label: 'Email' },
  ];

  const inputCls = 'w-full px-3 py-2 text-sm border border-warm-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400';
  const labelCls = 'block text-sm font-medium text-gray-700 mb-1';
  const classes = ['7A', '7B', '8A', '8B', '9A', '9B'];

  return (
    <div className="space-y-4">
      <DataTable
        title="Data Guru"
        columns={columns}
        data={teachers}
        onEdit={openEdit}
        onDelete={(row) => setDeleteConfirm(row)}
        actions={
          <div className="flex items-center gap-2">
            <button onClick={() => setImportOpen(true)} className="px-4 py-2 text-sm font-medium text-primary-700 bg-primary-50 hover:bg-primary-100 rounded-lg transition-all duration-200 flex items-center gap-2">
              <FileDown size={16} /> Impor
            </button>
            <button onClick={openAdd} className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-all duration-200 flex items-center gap-2">
              <UserPlus size={16} /> Tambah Guru
            </button>
          </div>
        }
      />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Edit Guru' : 'Tambah Guru'} size="lg">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>NIP</label>
            <input className={inputCls} value={form.nip} onChange={e => setForm(f => ({ ...f, nip: e.target.value }))} placeholder="Nomor Induk Pegawai" />
          </div>
          <div>
            <label className={labelCls}>Nama Lengkap</label>
            <input className={inputCls} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Nama guru" />
          </div>
          <div>
            <label className={labelCls}>Role</label>
            <select className={inputCls} value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value, homeroom: e.target.value !== 'homeroom' ? '' : f.homeroom }))}>
              <option value="admin">Admin</option>
              <option value="homeroom">Wali Kelas</option>
              <option value="subject">Guru Mata Pelajaran</option>
            </select>
          </div>
          {form.role === 'homeroom' && (
            <div>
              <label className={labelCls}>Wali Kelas</label>
              <select className={inputCls} value={form.homeroom} onChange={e => setForm(f => ({ ...f, homeroom: e.target.value }))}>
                <option value="">-- Pilih Kelas --</option>
                {classes.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className={labelCls}>Email</label>
            <input type="email" className={inputCls} value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@school.id" />
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-warm-200">
          <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-600 bg-warm-100 hover:bg-warm-200 rounded-lg transition-all duration-200">Batal</button>
          <button onClick={handleSave} className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-all duration-200">{editingId ? 'Simpan Perubahan' : 'Tambah Guru'}</button>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={deleteConfirm !== null}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => {
          deleteTeacher(deleteConfirm.id);
          setDeleteConfirm(null);
        }}
        title="Hapus Guru"
        message={`Hapus guru "${deleteConfirm?.name}"?`}
        confirmText="Ya, Hapus"
        variant="danger"
      />

      <ImportModal
        isOpen={importOpen}
        onClose={() => setImportOpen(false)}
        onImport={handleImport}
        title="Impor Data Guru"
        columns={importColumns}
        templateName="Template_Impor_Guru"
      />
    </div>
  );
}
