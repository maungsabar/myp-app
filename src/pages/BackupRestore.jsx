import { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import api from '../services/api';
import ConfirmDialog from '../components/shared/ConfirmDialog';
import {
  Database, Download, Upload, Trash2, RefreshCw,
  HardDrive, AlertTriangle, CheckCircle, Clock, FileText, Loader
} from 'lucide-react';

// Format bytes to human readable
function formatSize(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
}

// Format date to locale string
function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function BackupRestore() {
  const { showToast } = useApp();
  const [backups, setBackups] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [creatingBackup, setCreatingBackup] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [confirmRestore, setConfirmRestore] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const fileInputRef = useRef(null);

  // Load backup list
  const loadBackups = async () => {
    setLoadingList(true);
    try {
      const list = await api.getBackupList();
      setBackups(list);
    } catch (err) {
      showToast('error', `Gagal memuat daftar backup: ${err.message}`);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => { loadBackups(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Create backup
  const handleCreateBackup = async () => {
    setCreatingBackup(true);
    try {
      const result = await api.createBackup();
      showToast('success', `Backup berhasil dibuat: ${result.filename}`);
      await loadBackups();
    } catch (err) {
      showToast('error', `Gagal membuat backup: ${err.message}`);
    } finally {
      setCreatingBackup(false);
    }
  };

  // Download backup
  const handleDownload = async (filename) => {
    try {
      const blob = await api.downloadBackup(filename);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      showToast('error', `Gagal download backup: ${err.message}`);
    }
  };

  // Delete backup
  const handleDelete = async (filename) => {
    try {
      await api.deleteBackup(filename);
      showToast('success', 'File backup berhasil dihapus.');
      await loadBackups();
    } catch (err) {
      showToast('error', `Gagal menghapus backup: ${err.message}`);
    }
  };

  // Handle file selection for restore
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate extension
    if (!file.name.toLowerCase().endsWith('.sql')) {
      showToast('error', 'Hanya file .sql yang diperbolehkan.');
      e.target.value = '';
      return;
    }

    // Validate not empty
    if (file.size === 0) {
      showToast('error', 'File SQL kosong. Pilih file backup yang valid.');
      e.target.value = '';
      return;
    }

    setSelectedFile(file);
    setConfirmRestore(true);
  };

  // Execute restore
  const handleRestore = async () => {
    if (!selectedFile) return;
    setRestoring(true);
    try {
      const result = await api.restoreBackup(selectedFile);
      showToast('success', result.message || 'Database berhasil di-restore.');
    } catch (err) {
      showToast('error', `Gagal restore database: ${err.message}`);
    } finally {
      setRestoring(false);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="animate-fade-in">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-primary-800">Backup & Restore</h1>
        <p className="text-sm text-gray-500 mt-1">Kelola backup dan restore database aplikasi</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── Backup Section ──────────────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-warm-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-warm-200 bg-gradient-to-r from-primary-50 to-warm-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center">
                <Database size={20} className="text-white" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-primary-800">Backup Database</h2>
                <p className="text-xs text-gray-500">Buat salinan database saat ini</p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <button
              onClick={handleCreateBackup}
              disabled={creatingBackup}
              className="w-full flex items-center justify-center gap-2 px-5 py-3 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-xl transition-all duration-200 shadow-sm hover:shadow disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {creatingBackup ? (
                <>
                  <Loader size={16} className="animate-spin" />
                  Membuat backup...
                </>
              ) : (
                <>
                  <HardDrive size={16} />
                  Buat Backup Sekarang
                </>
              )}
            </button>

            {/* Backup List */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-700">Daftar Backup</h3>
                <button
                  onClick={loadBackups}
                  disabled={loadingList}
                  className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all duration-200"
                  title="Refresh"
                >
                  <RefreshCw size={14} className={loadingList ? 'animate-spin' : ''} />
                </button>
              </div>

              {loadingList ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
                </div>
              ) : backups.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 rounded-2xl bg-warm-100 flex items-center justify-center mx-auto mb-3">
                    <FileText size={24} className="text-gray-300" />
                  </div>
                  <p className="text-sm text-gray-400">Belum ada file backup</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {backups.map((backup) => (
                    <div
                      key={backup.filename}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-warm-100 hover:border-warm-200 hover:bg-warm-50 transition-all duration-200 group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                        <FileText size={14} className="text-blue-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-700 truncate">{backup.filename}</p>
                        <div className="flex items-center gap-3 text-[11px] text-gray-400">
                          <span className="flex items-center gap-1">
                            <Clock size={10} /> {formatDate(backup.createdAt)}
                          </span>
                          <span>{formatSize(backup.size)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <button
                          onClick={() => handleDownload(backup.filename)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                          title="Download"
                        >
                          <Download size={14} />
                        </button>
                        <button
                          onClick={() => setConfirmDelete(backup.filename)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                          title="Hapus"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Restore Section ─────────────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-warm-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-warm-200 bg-gradient-to-r from-amber-50 to-warm-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center">
                <Upload size={20} className="text-white" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-primary-800">Restore Database</h2>
                <p className="text-xs text-gray-500">Pulihkan database dari file backup</p>
              </div>
            </div>
          </div>

          <div className="p-6">
            {/* Warning */}
            <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200 mb-5">
              <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800">Perhatian</p>
                <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
                  Proses restore akan menggantikan <strong>seluruh data</strong> saat ini dengan data dari file backup.
                  Pastikan Anda sudah membuat backup terlebih dahulu sebelum melakukan restore.
                </p>
              </div>
            </div>

            {/* Upload Area */}
            <div
              onClick={() => !restoring && fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
                restoring
                  ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
                  : 'border-warm-300 hover:border-primary-400 hover:bg-primary-50/30'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".sql"
                onChange={handleFileSelect}
                disabled={restoring}
                className="hidden"
              />

              {restoring ? (
                <div>
                  <Loader size={32} className="text-primary-500 animate-spin mx-auto mb-3" />
                  <p className="text-sm font-medium text-gray-700">Sedang melakukan restore...</p>
                  <p className="text-xs text-gray-400 mt-1">Harap tunggu, proses ini mungkin memakan waktu beberapa saat.</p>
                </div>
              ) : (
                <div>
                  <div className="w-14 h-14 rounded-2xl bg-warm-100 flex items-center justify-center mx-auto mb-3">
                    <Upload size={24} className="text-gray-400" />
                  </div>
                  <p className="text-sm font-medium text-gray-700">Klik untuk memilih file backup</p>
                  <p className="text-xs text-gray-400 mt-1">Hanya file .sql yang didukung</p>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="mt-5 space-y-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Ketentuan File</p>
              <ul className="text-xs text-gray-400 space-y-1.5">
                <li className="flex items-center gap-2">
                  <CheckCircle size={12} className="text-green-400 shrink-0" />
                  Format file harus <code className="text-[11px] bg-warm-100 px-1 py-0.5 rounded">.sql</code>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={12} className="text-green-400 shrink-0" />
                  File tidak boleh kosong
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={12} className="text-green-400 shrink-0" />
                  File harus berisi SQL dari backup MySQL yang valid
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={12} className="text-green-400 shrink-0" />
                  Ukuran maksimal 500MB
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Confirm Restore Dialog */}
      <ConfirmDialog
        isOpen={confirmRestore}
        onClose={() => {
          setConfirmRestore(false);
          setSelectedFile(null);
          if (fileInputRef.current) fileInputRef.current.value = '';
        }}
        onConfirm={handleRestore}
        title="Konfirmasi Restore Database"
        message={`Seluruh data saat ini akan digantikan oleh data dari file backup "${selectedFile?.name || ''}". Proses ini tidak dapat dibatalkan. Apakah Anda yakin?`}
        confirmText="Ya, Restore"
        variant="warning"
      />

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => handleDelete(confirmDelete)}
        title="Hapus File Backup"
        message={`Apakah Anda yakin ingin menghapus file backup "${confirmDelete || ''}"?`}
        confirmText="Hapus"
        variant="danger"
      />
    </div>
  );
}
