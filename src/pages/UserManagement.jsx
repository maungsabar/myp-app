import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import api from '../services/api';
import { Plus, Key, Shield, GraduationCap, UserCircle, RotateCcw, Eye, EyeOff, Download, Trash2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import DataTable from '../components/shared/DataTable';
import Modal from '../components/shared/Modal';
import ConfirmDialog from '../components/shared/ConfirmDialog';

const tabs = [
  { key: 'admin', label: 'Administrator', icon: Shield, color: 'primary' },
  { key: 'coordinator', label: 'Koordinator', icon: GraduationCap, color: 'primary' },
  { key: 'homeroom', label: 'Wali Kelas', icon: GraduationCap, color: 'gold' },
  { key: 'subject', label: 'Guru Mapel', icon: GraduationCap, color: 'gold' },
  { key: 'student', label: 'Siswa', icon: UserCircle, color: 'gray' },
];

const DEFAULT_PASSWORDS = {
  admin: 'adminmilbos',
  coordinator: 'adminmilbos',
  homeroom: 'gurumilbos',
  subject: 'gurumilbos',
  student: 'siswamilbos',
};

export default function UserManagement() {
  const { users, setUsers, addUser, updateUser, deleteUser, bulkDeleteUsers, showToast } = useApp();
  const [activeTab, setActiveTab] = useState('admin');
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [form, setForm] = useState({ username: '', name: '', role: 'admin', email: '', password: '' });
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [resetConfirm, setResetConfirm] = useState(null);
  const [showPasswords, setShowPasswords] = useState({});
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);

  // Refresh users from API on mount (to pick up auto-created users from teacher/student)
  useEffect(() => {
    api.getUsers()
      .then(freshUsers => setUsers(freshUsers))
      .catch(() => {}); // silently use cached data if API fails
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const filteredUsers = users.filter(u => u.role === activeTab);

  const openAdd = () => {
    setEditUser(null);
    setForm({ username: '', name: '', role: activeTab, email: '', password: '' });
    setShowModal(true);
  };

  const openEdit = (row) => {
    setEditUser(row);
    setForm({ username: row.username, name: row.name, role: row.role, email: row.email, password: '' });
    setShowModal(true);
  };

  const handleSave = () => {
    if (!form.username || !form.name) return;
    if (editUser) {
      updateUser(editUser.id, { username: form.username, name: form.name, role: form.role, email: form.email });
    } else {
      addUser(form);
    }
    setShowModal(false);
  };

  const handleDelete = (row) => {
    setDeleteConfirm(row);
  };

  const handleResetPassword = async (user) => {
    try {
      const updated = await api.resetPassword(user.id);
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, ...updated } : u));
      showToast('success', `Password "${user.name}" berhasil direset ke default.`);
    } catch (err) {
      showToast('error', `Gagal mereset password: ${err.message}`);
    }
    setResetConfirm(null);
  };

  const togglePasswordVisibility = (userId) => {
    setShowPasswords(prev => ({ ...prev, [userId]: !prev[userId] }));
  };

  const baseColumns = [
    { key: 'username', label: 'Username' },
    { key: 'name', label: 'Nama Lengkap' },
    { key: 'email', label: 'Email' },
    {
      key: 'passwordDisplay', label: 'Password',
      render: (_, row) => {
        const isDefault = row.isDefaultPassword;
        const isVisible = showPasswords[row.id];
        if (isDefault) {
          return (
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded border border-amber-200">
                {isVisible ? (row.passwordDisplay || DEFAULT_PASSWORDS[row.role]) : '••••••••'}
              </span>
              <button
                onClick={() => togglePasswordVisibility(row.id)}
                className="p-1 text-gray-400 hover:text-primary-600 transition-colors"
                title={isVisible ? 'Sembunyikan' : 'Lihat password'}
              >
                {isVisible ? <EyeOff size={13} /> : <Eye size={13} />}
              </button>
              <span className="text-[10px] text-amber-500 font-medium">default</span>
            </div>
          );
        }
        return (
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-xs bg-gray-100 text-gray-400 px-2 py-0.5 rounded">
              ••••••••
            </span>
            <span className="text-[10px] text-emerald-500 font-medium">changed</span>
          </div>
        );
      },
    },
    {
      key: 'lastLogin', label: 'Login Terakhir',
      render: (v) => <span className="text-gray-400 text-xs">{v || '-'}</span>
    },
  ];

  // Add reset password action column for all non-admin tabs
  const columns = activeTab !== 'admin'
    ? [
        ...baseColumns,
        {
          key: '_reset', label: '', sortable: false,
          render: (_, row) => (
            <button
              onClick={() => setResetConfirm(row)}
              className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-amber-600 bg-amber-50 hover:bg-amber-100 rounded-lg transition-all duration-200 border border-amber-200"
              title="Reset ke password default"
            >
              <RotateCcw size={12} /> Reset
            </button>
          ),
        },
      ]
    : baseColumns;

  const showDownload = activeTab === 'subject' || activeTab === 'student';

  const handleDownload = () => {
    const data = filteredUsers.map(u => ({
      'Nama Lengkap': u.name,
      'Username': u.username,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    ws['!cols'] = [{ wch: 35 }, { wch: 25 }];
    const wb = XLSX.utils.book_new();
    const sheetName = activeTab === 'subject' ? 'Guru Mapel' : 'Siswa';
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, `Data ${sheetName}.xlsx`);
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-primary-800">Kelola User</h1>
        <p className="text-sm text-gray-500 mt-1">Manajemen akun administrator, guru, dan siswa</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-warm-100 p-1 rounded-xl w-fit">
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => { setActiveTab(tab.key); setSelectedIds(new Set()); }}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200
              ${activeTab === tab.key ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      <DataTable
        title={`Daftar ${tabs.find(t => t.key === activeTab)?.label}`}
        columns={columns}
        data={filteredUsers}
        onEdit={openEdit}
        onDelete={handleDelete}
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
          <div className="flex gap-2">
            {showDownload && (
              <button onClick={handleDownload}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-700 bg-primary-50 hover:bg-primary-100 rounded-lg transition-all duration-200 border border-primary-200">
                <Download size={16} /> Download
              </button>
            )}
            <button onClick={openAdd}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-all duration-200">
              <Plus size={16} /> Tambah User
            </button>
          </div>
        }
      />

      {/* Add/Edit Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editUser ? 'Edit User' : 'Tambah User'}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Username</label>
              <input type="text" value={form.username} onChange={e => setForm(prev => ({ ...prev, username: e.target.value }))}
                className="w-full px-3 py-2.5 text-sm border border-warm-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Role</label>
              <select value={form.role} onChange={e => setForm(prev => ({ ...prev, role: e.target.value }))}
                className="w-full px-3 py-2.5 text-sm border border-warm-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400">
                <option value="admin">Administrator</option>
                <option value="coordinator">Koordinator MYP</option>
                <option value="homeroom">Wali Kelas</option>
                <option value="subject">Guru Mata Pelajaran</option>
                <option value="student">Siswa</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Nama Lengkap</label>
            <input type="text" value={form.name} onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2.5 text-sm border border-warm-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Email</label>
            <input type="email" value={form.email} onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))}
              className="w-full px-3 py-2.5 text-sm border border-warm-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400" />
          </div>
          {!editUser && (
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Password</label>
              <input type="password" value={form.password} onChange={e => setForm(prev => ({ ...prev, password: e.target.value }))}
                placeholder={`Kosongkan untuk password default (${DEFAULT_PASSWORDS[form.role]})`}
                className="w-full px-3 py-2.5 text-sm border border-warm-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400" />
            </div>
          )}
          <div className="flex gap-3 justify-end pt-2">
            <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-medium text-gray-600 bg-warm-100 hover:bg-warm-200 rounded-lg transition-all duration-200">Batal</button>
            <button onClick={handleSave} className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-all duration-200">Simpan</button>
          </div>
        </div>
      </Modal>

      {/* Reset Password Confirm Dialog */}
      <ConfirmDialog
        isOpen={resetConfirm !== null}
        onClose={() => setResetConfirm(null)}
        onConfirm={() => handleResetPassword(resetConfirm)}
        title="Reset Password ke Default"
        message={`Reset password "${resetConfirm?.name}" ke password default "${DEFAULT_PASSWORDS[resetConfirm?.role] || 'default'}"?`}
        confirmText="Ya, Reset"
        variant="warning"
      />

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={deleteConfirm !== null}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => { deleteUser(deleteConfirm.id); setDeleteConfirm(null); }}
        title="Hapus User"
        message={`Hapus user "${deleteConfirm?.name}"?`}
        confirmText="Ya, Hapus"
        variant="danger"
      />

      {/* Bulk Delete Confirm */}
      <ConfirmDialog
        isOpen={bulkDeleteConfirm}
        onClose={() => setBulkDeleteConfirm(false)}
        onConfirm={async () => {
          const ids = Array.from(selectedIds);
          const result = await bulkDeleteUsers(ids);
          if (result) {
            showToast('success', `${result.deletedCount} user berhasil dihapus.`);
            setSelectedIds(new Set());
          }
          setBulkDeleteConfirm(false);
        }}
        title="Hapus Massal User"
        message={`Anda yakin ingin menghapus ${selectedIds.size} user yang dipilih? Tindakan ini tidak dapat dibatalkan.`}
        confirmText="Ya, Hapus Semua"
        variant="danger"
      />
    </div>
  );
}
