# IB-MYP School Report System

Sistem Informasi Rapor berbasis web untuk sekolah IB Middle Years Programme (MYP). Aplikasi ini mengelola data siswa, guru, nilai, kehadiran, dan menghasilkan rapor siswa sesuai standar MYP.

## Daftar Isi

- [Fitur Utama](#fitur-utama)
- [Teknologi](#teknologi)
- [Struktur Database](#struktur-database)
- [Role & Hak Akses](#role--hak-akses)
- [Cara Menjalankan Lokal](#cara-menjalankan-lokal)
- [Cara Deploy](#cara-deploy)
- [Struktur Proyek](#struktur-proyek)

## Fitur Utama

### Master Data
- **Data Siswa** — CRUD data siswa, impor massal dari Excel (NIS, nama, kelas, gender, tanggal lahir, email orang tua)
- **Naik Kelas** — Promosi siswa ke kelas berikutnya di akhir tahun ajaran, termasuk kelulusan kelas 9
- **Alumni** — Data siswa yang sudah lulus
- **Data Guru** — CRUD data guru, impor massal dari Excel (NIP, nama, role, email)
- **Mengajar** — Penugasan guru ke kombinasi kelas + mata pelajaran
- **Data Kelas** — Pengelolaan kelas (7A–9B) beserta wali kelas
- **Mata Pelajaran** — CRUD mata pelajaran MYP (9 kategori), konfigurasi jumlah kriteria per tingkat kelas, dan ketersediaan per grade
- **Setup Deskriptor** — Pengaturan deskriptor per kriteria per tingkat kelas, dengan 5 level pencapaian MYP (0, 1–2, 3–4, 5–6, 7–8)
- **Grade Boundaries** — Konfigurasi batas nilai MYP Grade 1–7

### Akademik
- **Input Nilai** — Input nilai per kriteria (A/B/C/D, skor 0–8) per siswa per mata pelajaran, dengan filter grade → kelas → mata pelajaran
- **Kehadiran & Catatan** — Input kehadiran (hadir/izin/sakit/tanpa keterangan) dan komentar wali kelas per semester

### Laporan
- **Cetak Rapor** — Preview dan cetak rapor siswa lengkap (format A4), terdiri dari:
  - Surat pengantar
  - Assessment Criteria & Grade Boundaries
  - Progress Summary (rekap semua mata pelajaran)
  - Detail per mata pelajaran (deskriptor sesuai level pencapaian)
  - IB Learner Profile
  - Download rapor sebagai PDF

### Pengaturan
- **Profil Sekolah** — Nama sekolah, alamat, kepala sekolah, koordinator MYP, logo
- **Profil Pembelajar IB** — 10 atribut IB Learner Profile (nama, deskripsi, urutan, logo)
- **Tahun Pelajaran** — Kelola tahun ajaran, semester aktif, nama semester kustom
- **Kelola User** — Manajemen akun pengguna (admin, koordinator, wali kelas, guru mapel, siswa), reset password, download data guru/siswa

### Dashboard
- **Admin/Koordinator** — Statistik total siswa, guru, rata-rata MYP, grafik kelas
- **Guru (Wali Kelas)** — Info sekolah, statistik kelas, ringkasan kehadiran, grafik perkembangan
- **Guru Mapel** — Info sekolah, statistik kelas, grafik perkembangan
- **Siswa** — Grafik perkembangan rata-rata MYP per semester, grafik nilai per mata pelajaran, donut chart kehadiran

### Autentikasi & Keamanan
- JWT token (24 jam)
- 5 role: admin, coordinator, homeroom, subject, student
- Password default otomatis saat guru/siswa ditambahkan
- Fitur reset dan ganti password
- Rate limiting (1000 request / 15 menit)
- Helmet security headers
- CORS origin-aware

## Teknologi

### Frontend
| Teknologi | Versi | Fungsi |
|-----------|-------|--------|
| React | 19.2 | UI framework |
| Vite | 8.0 | Build tool & dev server |
| Tailwind CSS | 4.3 | Utility-first CSS |
| React Router | 7.18 | Client-side routing |
| Recharts | 3.8 | Grafik (line, bar, pie chart) |
| SheetJS (xlsx) | 0.18 | Import/export Excel |
| Lucide React | 1.20 | Ikon |

### Backend
| Teknologi | Versi | Fungsi |
|-----------|-------|--------|
| Node.js | 18+ | Runtime |
| Express | 5.1 | HTTP server & routing |
| Prisma | 6.10 | ORM & database migration |
| MySQL | 8.0+ | Database |
| jsonwebtoken | 9.0 | JWT authentication |
| Helmet | 8.2 | Security headers |
| express-rate-limit | 8.5 | Rate limiting |
| CORS | 2.8 | Cross-origin resource sharing |

### Font
- **Plus Jakarta Sans** — UI utama
- **Montserrat** — Halaman rapor

## Struktur Database

15 tabel:

| Tabel | Fungsi |
|-------|--------|
| `students` | Data siswa (NIS, nama, kelas, gender, status) |
| `teachers` | Data guru (NIP, nama, role, homeroom) |
| `classes` | Kelas (nama, level, wali kelas) |
| `subjects` | Mata pelajaran (nama, kategori, kriteria config) |
| `teaching_assignments` | Penugasan guru ke kelas + mapel |
| `grades` | Nilai siswa per kriteria per mapel per semester |
| `attendances` | Kehadiran siswa per semester |
| `homeroom_comments` | Komentar wali kelas per semester |
| `academic_years` | Tahun ajaran & semester aktif |
| `school_profile` | Profil sekolah (singleton) |
| `users` | Akun pengguna & autentikasi |
| `alumni` | Data siswa lulusan |
| `criteria_descriptors` | Deskriptor per kriteria per mapel per grade |
| `learner_profiles` | 10 atribut IB Learner Profile |
| `grade_boundaries` | Batas nilai MYP Grade 1–7 |
| `app_settings` | Pengaturan aplikasi (key-value) |

## Role & Hak Akses

| Role | Halaman yang Diakses |
|------|---------------------|
| **admin** | Semua halaman |
| **coordinator** | Dashboard, Mata Pelajaran, Setup Deskriptor, Grade Boundaries, Cetak Rapor |
| **homeroom** | Dashboard, Input Nilai, Kehadiran & Catatan, Cetak Rapor |
| **subject** | Dashboard, Input Nilai (hanya mapel yang diampu) |
| **student** | Dashboard (grafik pribadi), Cetak Rapor (hanya rapor sendiri) |

### Password Default
| Role | Password |
|------|----------|
| admin, coordinator | `adminmilbos` |
| homeroom, subject | `gurumilbos` |
| student | `siswamilbos` |

## Cara Menjalankan Lokal

### Prasyarat
- Node.js 18+
- MySQL 8.0+
- npm

### 1. Clone & Install

```bash
# Clone repository
git clone <repo-url>
cd ib-app

# Install frontend
npm install

# Install backend
cd server
npm install
```

### 2. Setup Database

```bash
# Di folder server
# Edit file .env — sesuaikan DATABASE_URL
cp .env.example .env

# Buat database di MySQL
mysql -u root -p -e "CREATE DATABASE ib_myp;"

# Push schema ke database
npx prisma db push

# Generate Prisma Client
npx prisma generate

# Seed data awal
node prisma/seed.js
```

### 3. Jalankan Backend

```bash
# Di folder server
npm run dev
# Server berjalan di http://localhost:3001
```

### 4. Jalankan Frontend

```bash
# Di folder root (ib-app)
npm run dev
# Frontend berjalan di http://localhost:5173
# API request otomatis di-proxy ke localhost:3001
```

### 5. Login

Buka `http://localhost:5173` dan login dengan:
- **Username:** `admin`
- **Password:** `adminmilbos`

## Cara Deploy

### Opsi 1: VPS (Recommended)

#### Server (Backend)
```bash
# Di VPS
cd server
cp .env.example .env
# Edit .env:
#   NODE_ENV=production
#   DATABASE_URL=mysql://user:password@localhost:3306/ib_myp
#   JWT_SECRET=<random-64-char-string>
#   CORS_ORIGIN=https://your-domain.com

npm install
npx prisma db push
npx prisma generate
node prisma/seed.js

# Jalankan dengan PM2 (process manager)
npm install -g pm2
pm2 start src/index.js --name ib-myp-server
pm2 save
pm2 startup
```

#### Frontend
```bash
# Build frontend
npm run build

# Deploy folder dist/ ke web server (Nginx/Apache)
# Contoh Nginx config:
# server {
#     listen 80;
#     server_name your-domain.com;
#     root /var/www/ib-app/dist;
#     index index.html;
#
#     location / {
#         try_files $uri $uri/ /index.html;
#     }
#
#     location /api {
#         proxy_pass http://localhost:3001;
#         proxy_set_header Host $host;
#         proxy_set_header X-Real-IP $remote_addr;
#     }
# }
```

### Opsi 2: Platform Hosting

| Layanan | Untuk | Catatan |
|---------|-------|---------|
| **Railway** | Backend + Database | Support Node.js + MySQL, free tier tersedia |
| **Render** | Backend | Free tier, auto-deploy dari Git |
| **Vercel / Netlify** | Frontend | Deploy folder `dist/`, set API proxy |
| **Hostinger VPS** | Full stack | Node.js + MySQL + Nginx |

> **Catatan:** Shared hosting (cPanel/PHP) **tidak bisa** menjalankan aplikasi ini karena membutuhkan Node.js runtime.

### Environment Variables (Production)

Salin `server/.env.example` ke `server/.env` dan isi:

```env
NODE_ENV=production
PORT=3001
DATABASE_URL=mysql://user:password@host:3306/ib_myp
CORS_ORIGIN=https://your-domain.com
JWT_SECRET=<generate-random-64-char-string>
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000
LOG_LEVEL=info
```

Generate JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Struktur Proyek

```
ib-app/
├── src/                          # Frontend source
│   ├── components/
│   │   ├── auth/                 # ProtectedRoute
│   │   ├── layout/               # AppShell, Sidebar, Header, Footer, ToastBanner
│   │   └── shared/               # DataTable, Modal, ConfirmDialog, ImportModal, ReportPreviewModal
│   ├── context/
│   │   └── AppContext.jsx        # Global state management
│   ├── data/
│   │   └── dummyData.js          # Konstanta & utility functions
│   ├── pages/                    # 20 halaman
│   ├── services/
│   │   └── api.js                # API client (fetch wrapper + auth token)
│   ├── App.jsx                   # Routing & SmartDashboard
│   ├── main.jsx                  # Entry point
│   └── index.css                 # Global styles & Tailwind config
├── server/                       # Backend source
│   ├── prisma/
│   │   ├── schema.prisma         # Database schema (15 models)
│   │   └── seed.js               # Data seeder
│   ├── src/
│   │   ├── middleware/
│   │   │   └── auth.js           # JWT authenticate & authorize
│   │   ├── routes/               # 18 route files
│   │   ├── db.js                 # Prisma client export
│   │   └── index.js              # Express server entry
│   ├── .env.example              # Production env template
│   └── package.json
├── package.json                  # Frontend dependencies
├── vite.config.js                # Vite config + API proxy
└── index.html                    # HTML entry
```

## Lisensi

Proprietary — MTs MILBoS
