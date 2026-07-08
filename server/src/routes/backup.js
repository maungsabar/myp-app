import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import {
  BACKUP_DIR,
  createBackup,
  listBackups,
  validateSqlFile,
  restoreFromFile,
} from '../utils/backupService.js';

const router = Router();

// Multer config for restore file upload
const upload = multer({
  dest: path.join(BACKUP_DIR, '.tmp'),
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB max
  fileFilter: (req, file, cb) => {
    if (path.extname(file.originalname).toLowerCase() !== '.sql') {
      return cb(new Error('Hanya file .sql yang diperbolehkan.'));
    }
    cb(null, true);
  },
});

// Sanitize & validate backup filename
function resolveBackupPath(filename) {
  const safeName = path.basename(filename);
  if (!safeName.endsWith('.sql') || !safeName.startsWith('backup_')) {
    return null;
  }
  const filePath = path.join(BACKUP_DIR, safeName);
  return fs.existsSync(filePath) ? { safeName, filePath } : undefined;
}

// POST /api/backup/create — create a new database backup
router.post('/create', async (req, res) => {
  try {
    const result = await createBackup();
    res.json({ success: true, ...result });
  } catch (err) {
    console.error('Backup error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/backup/list — list all backup files
router.get('/list', async (req, res) => {
  try {
    res.json(listBackups());
  } catch (err) {
    console.error('List backup error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/backup/download/:filename — download a backup file
router.get('/download/:filename', async (req, res) => {
  try {
    const resolved = resolveBackupPath(req.params.filename);
    if (resolved === null) return res.status(400).json({ error: 'Nama file tidak valid.' });
    if (resolved === undefined) return res.status(404).json({ error: 'File backup tidak ditemukan.' });
    res.download(resolved.filePath, resolved.safeName);
  } catch (err) {
    console.error('Download backup error:', err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/backup/:filename — delete a backup file
router.delete('/:filename', async (req, res) => {
  try {
    const resolved = resolveBackupPath(req.params.filename);
    if (resolved === null) return res.status(400).json({ error: 'Nama file tidak valid.' });
    if (resolved === undefined) return res.status(404).json({ error: 'File backup tidak ditemukan.' });
    fs.unlinkSync(resolved.filePath);
    res.json({ success: true, message: 'File backup berhasil dihapus.' });
  } catch (err) {
    console.error('Delete backup error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/backup/restore — restore database from uploaded SQL file
router.post('/restore', upload.single('file'), async (req, res) => {
  let tmpPath = null;
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'File SQL tidak ditemukan. Silakan upload file .sql.' });
    }

    tmpPath = req.file.path;
    validateSqlFile(tmpPath);
    await restoreFromFile(tmpPath);

    res.json({ success: true, message: 'Database berhasil di-restore dari file backup.' });
  } catch (err) {
    console.error('Restore error:', err);
    res.status(500).json({ error: err.message });
  } finally {
    if (tmpPath && fs.existsSync(tmpPath)) {
      try { fs.unlinkSync(tmpPath); } catch { /* ignore cleanup errors */ }
    }
  }
});

// Handle multer errors
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'Ukuran file terlalu besar. Maksimal 500MB.' });
    }
    return res.status(400).json({ error: err.message });
  }
  if (err.message === 'Hanya file .sql yang diperbolehkan.') {
    return res.status(400).json({ error: err.message });
  }
  next(err);
});

export default router;
