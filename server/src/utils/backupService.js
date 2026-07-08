import { execFile } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { findMysqlBin } from './mysqlLocator.js';

const execFileAsync = promisify(execFile);

// __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** Path ke folder backup */
export const BACKUP_DIR = path.resolve(__dirname, '../../backups');

// Ensure backup directory exists on module load
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

/**
 * Parse DATABASE_URL menjadi object koneksi MySQL.
 * @returns {{ user: string, password: string, host: string, port: string, database: string }}
 */
export function parseDatabaseUrl() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL tidak ditemukan di environment.');

  const match = url.match(/^mysql:\/\/([^:]*):?([^@]*)@([^:]+):(\d+)\/(.+)$/);
  if (!match) throw new Error('Format DATABASE_URL tidak valid.');

  return {
    user: match[1],
    password: match[2] || '',
    host: match[3],
    port: match[4],
    database: match[5],
  };
}

/**
 * Build array argumen koneksi MySQL dari db config.
 * @param {{ user: string, password: string, host: string, port: string }} db
 * @returns {string[]}
 */
function buildConnectionArgs(db) {
  const args = [
    `-h${db.host}`,
    `-P${db.port}`,
    `-u${db.user}`,
  ];
  if (db.password) {
    args.push(`-p${db.password}`);
  }
  return args;
}

/**
 * Format Date ke string: YYYY-MM-DD_HH-mm-ss
 */
function formatDate(date) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}_${pad(date.getHours())}-${pad(date.getMinutes())}-${pad(date.getSeconds())}`;
}

/**
 * Translate error ke pesan user-friendly.
 */
function friendlyError(err, toolName) {
  if (err.code === 'ENOENT') {
    return `${toolName} tidak ditemukan. Pastikan MySQL client tools terinstall. Atur MYSQL_BIN di file .env jika lokasi non-standar.`;
  }
  if (err.message?.includes('Access denied')) {
    return 'Akses database ditolak. Periksa username dan password di DATABASE_URL.';
  }
  return err.message;
}

/**
 * Buat backup database menggunakan mysqldump.
 * @returns {Promise<{ filename: string, size: number, createdAt: Date }>}
 */
export async function createBackup() {
  const db = parseDatabaseUrl();
  const timestamp = formatDate(new Date());
  const filename = `backup_${timestamp}.sql`;
  const filePath = path.join(BACKUP_DIR, filename);

  const mysqldumpBin = findMysqlBin('mysqldump');

  const args = [
    ...buildConnectionArgs(db),
    '--routines',
    '--triggers',
    '--events',
    '--single-transaction',
    '--result-file=' + filePath,
    db.database,
  ];

  try {
    await execFileAsync(mysqldumpBin, args, { timeout: 120000 });
  } catch (err) {
    throw new Error(friendlyError(err, 'mysqldump'));
  }

  if (!fs.existsSync(filePath)) {
    throw new Error('File backup tidak berhasil dibuat.');
  }

  const stats = fs.statSync(filePath);
  return {
    filename,
    size: stats.size,
    createdAt: stats.birthtime || stats.mtime,
  };
}

/**
 * Daftar semua file backup, diurutkan terbaru dulu.
 * @returns {{ filename: string, size: number, createdAt: Date }[]}
 */
export function listBackups() {
  return fs.readdirSync(BACKUP_DIR)
    .filter(f => f.endsWith('.sql') && f.startsWith('backup_'))
    .map(filename => {
      const stats = fs.statSync(path.join(BACKUP_DIR, filename));
      return {
        filename,
        size: stats.size,
        createdAt: stats.birthtime || stats.mtime,
      };
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

/**
 * Validasi isi file SQL — cek header untuk SQL keywords.
 * @param {string} filePath
 * @throws {Error} jika file tidak valid
 */
export function validateSqlFile(filePath) {
  const stats = fs.statSync(filePath);
  if (stats.size === 0) {
    throw new Error('File SQL kosong. Upload file backup yang valid.');
  }

  const header = fs.readFileSync(filePath, { encoding: 'utf-8', flag: 'r' }).slice(0, 2048);
  const sqlIndicators = ['CREATE', 'INSERT', 'DROP', 'ALTER', 'SET', '--', '/*'];
  const hasSqlContent = sqlIndicators.some(kw => header.toUpperCase().includes(kw));
  if (!hasSqlContent) {
    throw new Error('File tidak berisi SQL yang valid. Pastikan file adalah hasil backup database MySQL.');
  }
}

/**
 * Restore database dari file SQL menggunakan mysql client.
 * @param {string} filePath - Path absolut ke file SQL
 * @returns {Promise<void>}
 */
export async function restoreFromFile(filePath) {
  const db = parseDatabaseUrl();
  const mysqlBin = findMysqlBin('mysql');

  const args = [
    ...buildConnectionArgs(db),
    db.database,
    '-e', `source ${filePath.replace(/\\/g, '/')}`,
  ];

  try {
    await execFileAsync(mysqlBin, args, { timeout: 300000 });
  } catch (err) {
    throw new Error(friendlyError(err, 'mysql'));
  }
}
