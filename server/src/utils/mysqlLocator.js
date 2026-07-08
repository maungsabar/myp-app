import fs from 'fs';
import path from 'path';

/**
 * MySQL Binary Locator
 *
 * Menemukan path binary MySQL (mysqldump, mysql) dengan urutan:
 * 1. MYSQL_BIN dari environment variable (.env)
 * 2. Auto-detect di lokasi instalasi umum (Laragon, XAMPP, MySQL Server, MariaDB)
 * 3. Fallback ke nama binary saja (mengandalkan PATH sistem)
 */

// Lokasi instalasi umum MySQL di Windows
const COMMON_PATHS = [
  // Laragon — mendukung berbagai versi MySQL/MariaDB
  'C:\\laragon\\bin\\mysql',
  // XAMPP
  'C:\\xampp\\mysql\\bin',
  // MySQL Community Server
  'C:\\Program Files\\MySQL',
  // MariaDB
  'C:\\Program Files\\MariaDB',
];

// Cache hasil pencarian agar tidak scan filesystem berulang kali
const binCache = new Map();

/**
 * Scan direktori untuk menemukan binary MySQL.
 * Mendukung struktur nested (misal laragon/bin/mysql/mysql-8.0.30-winx64/bin/)
 */
function scanForBinary(basePath, binaryName) {
  try {
    if (!fs.existsSync(basePath)) return null;

    const stat = fs.statSync(basePath);

    // Jika basePath langsung berisi binary
    if (stat.isDirectory()) {
      const directPath = path.join(basePath, binaryName);
      if (fs.existsSync(directPath)) return directPath;

      const directPathExe = path.join(basePath, `${binaryName}.exe`);
      if (fs.existsSync(directPathExe)) return directPathExe;
    }

    // Scan subdirectories (untuk struktur Laragon: mysql/mysql-8.x/bin/)
    if (stat.isDirectory()) {
      const entries = fs.readdirSync(basePath, { withFileTypes: true });
      for (const entry of entries) {
        if (!entry.isDirectory()) continue;

        const subDir = path.join(basePath, entry.name);

        // Cek langsung di subdirectory
        const inSub = path.join(subDir, binaryName);
        if (fs.existsSync(inSub)) return inSub;
        const inSubExe = path.join(subDir, `${binaryName}.exe`);
        if (fs.existsSync(inSubExe)) return inSubExe;

        // Cek di subdirectory/bin/
        const inBin = path.join(subDir, 'bin', binaryName);
        if (fs.existsSync(inBin)) return inBin;
        const inBinExe = path.join(subDir, 'bin', `${binaryName}.exe`);
        if (fs.existsSync(inBinExe)) return inBinExe;
      }
    }
  } catch {
    // Ignore filesystem errors (permission denied, etc.)
  }
  return null;
}

/**
 * Menemukan path lengkap untuk binary MySQL.
 *
 * @param {string} binaryName - Nama binary ('mysqldump' atau 'mysql')
 * @returns {string} Path lengkap ke binary, atau nama binary saja sebagai fallback PATH
 */
export function findMysqlBin(binaryName) {
  // Return dari cache jika sudah pernah ditemukan
  if (binCache.has(binaryName)) {
    return binCache.get(binaryName);
  }

  let resolved = null;

  // 1. Cek MYSQL_BIN dari environment
  const envBinDir = process.env.MYSQL_BIN;
  if (envBinDir) {
    const envPath = path.join(envBinDir, binaryName);
    if (fs.existsSync(envPath)) {
      resolved = envPath;
    } else {
      const envPathExe = path.join(envBinDir, `${binaryName}.exe`);
      if (fs.existsSync(envPathExe)) {
        resolved = envPathExe;
      }
    }
  }

  // 2. Auto-detect di lokasi umum
  if (!resolved) {
    for (const basePath of COMMON_PATHS) {
      resolved = scanForBinary(basePath, binaryName);
      if (resolved) break;
    }
  }

  // 3. Fallback ke nama binary (mengandalkan PATH sistem)
  if (!resolved) {
    resolved = binaryName;
  }

  // Cache hasil
  binCache.set(binaryName, resolved);

  if (resolved !== binaryName) {
    console.log(`[mysqlLocator] ${binaryName} ditemukan di: ${resolved}`);
  }

  return resolved;
}
