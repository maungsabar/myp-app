# IB-MYP Report System

Sistem Rapor IB Middle Years Programme (MYP) — Production Monorepo.

## Tech Stack

| Layer    | Technology                        |
|----------|-----------------------------------|
| Frontend | React 19, Vite, TailwindCSS v4    |
| Backend  | Express 5, Prisma, JWT            |
| Database | MySQL                             |
| Hosting  | Hostinger Business (Node.js 22)   |

## Project Structure

```
/
├── client/                 ← React Frontend
│   ├── src/
│   │   ├── components/     ← UI components (auth, layout, shared)
│   │   ├── context/        ← React context (AppContext)
│   │   ├── data/           ← Static data
│   │   ├── pages/          ← Page components (22 pages)
│   │   ├── services/       ← API service layer
│   │   ├── App.jsx         ← Router & app shell
│   │   ├── main.jsx        ← Entry point
│   │   └── index.css       ← Global styles
│   ├── public/             ← Static assets (favicons, icons)
│   ├── index.html          ← Vite HTML entry
│   ├── vite.config.js
│   ├── eslint.config.js
│   └── package.json
│
├── server/                 ← Express Backend
│   ├── src/
│   │   ├── routes/         ← 19 API route modules
│   │   ├── middleware/     ← JWT auth middleware
│   │   ├── utils/          ← Grade calculation helpers
│   │   ├── index.js        ← Express entrypoint
│   │   └── db.js           ← Prisma client
│   ├── prisma/
│   │   ├── schema.prisma   ← Database schema
│   │   └── seed.js         ← Database seeder
│   ├── .env                ← Environment variables (not committed)
│   ├── .env.example        ← Environment template
│   └── package.json
│
├── .env.example            ← Root environment template
├── .gitignore
├── package.json            ← Monorepo orchestrator
└── README.md
```

## Quick Start (Development)

```bash
# 1. Install all dependencies (root + client + server)
npm install

# 2. Setup environment
cp .env.example server/.env
# Edit server/.env with your database credentials

# 3. Setup database
cd server
npx prisma db push
npm run seed
cd ..

# 4. Start development (client + server concurrently)
npm run dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

## Available Scripts

| Script              | Description                               |
|---------------------|-------------------------------------------|
| `npm install`       | Install all deps (root + client + server) |
| `npm run build`     | Build React frontend for production       |
| `npm start`         | Start production server                   |
| `npm run dev`       | Start client + server in dev mode         |
| `npm run dev:client` | Start only Vite dev server               |
| `npm run dev:server` | Start only Express dev server            |
| `npm run lint`      | Lint frontend code                        |
| `npm run seed`      | Seed database with sample data            |
| `npm run prisma:generate` | Regenerate Prisma Client            |
| `npm run prisma:migrate`  | Run database migrations             |

## Deployment (Hostinger Node.js Hosting)

### Steps

```bash
# 1. Clone repository on server
git clone <repo-url>
cd <repo-name>

# 2. Setup environment
cp .env.example server/.env
# Edit server/.env:
#   NODE_ENV=production
#   DATABASE_URL=mysql://user:pass@host:3306/dbname
#   JWT_SECRET=<random-64-char-string>
#   CORS_ORIGIN=https://yourdomain.com

# 3. Install, build, and start
npm install
npm run build
npm start
```

### Hostinger Configuration

| Setting       | Value                  |
|---------------|------------------------|
| Node version  | 22                     |
| Entry point   | `server/src/index.js`  |
| Install cmd   | `npm install`          |
| Build cmd     | `npm run build`        |
| Start cmd     | `npm start`            |

### How It Works in Production

1. `npm install` → installs root deps → triggers `postinstall` → installs client + server deps → Prisma generates client
2. `npm run build` → builds React app → output to `client/dist/`
3. `npm start` → starts Express on configured PORT → serves API routes + static frontend

Express middleware order:
```
helmet → compression → cors → json → urlencoded → rate-limit → API routes → static files → SPA fallback → API 404 → error handler
```

## API Endpoints

All endpoints are prefixed with `/api/`.

| Endpoint                  | Auth Required | Roles                                        |
|---------------------------|:---:|----------------------------------------------|
| `GET /api/health`         | ✗   | Public                                       |
| `POST /api/auth/login`    | ✗   | Public                                       |
| `GET /api/auth/me`        | ✓   | Any authenticated                            |
| `POST /api/auth/change-password` | ✓ | Any authenticated                       |
| `/api/school-profile/public` | ✗ | Public                                      |
| `/api/students`           | ✓   | admin, coordinator, homeroom, subject, student |
| `/api/teachers`           | ✓   | admin, coordinator, homeroom, subject        |
| `/api/classes`            | ✓   | admin, coordinator, homeroom, subject, student |
| `/api/subjects`           | ✓   | admin, coordinator, homeroom, subject, student |
| `/api/grades`             | ✓   | admin, coordinator, homeroom, subject, student |
| `/api/attendance`         | ✓   | admin, coordinator, homeroom, student        |
| `/api/homeroom-comments`  | ✓   | admin, coordinator, homeroom, student        |
| `/api/academic-years`     | ✓   | admin, coordinator, homeroom, subject, student |
| `/api/school-profile`     | ✓   | admin, coordinator, homeroom, subject, student |
| `/api/users`              | ✓   | admin                                        |
| `/api/alumni`             | ✓   | admin                                        |
| `/api/criteria-descriptors` | ✓ | admin, coordinator, homeroom, subject, student |
| `/api/learner-profiles`   | ✓   | admin, coordinator, homeroom, subject, student |
| `/api/settings`           | ✓   | admin                                        |
| `/api/dashboard`          | ✓   | Any authenticated                            |
| `/api/teaching-assignments` | ✓ | admin, coordinator, homeroom, subject        |
| `/api/grade-boundaries`   | ✓   | admin, coordinator, student                  |
| `/api/grade-progress`     | ✓   | admin, coordinator, homeroom                 |

## Environment Variables

| Variable                 | Required | Default | Description                        |
|--------------------------|:---:|---------|------------------------------------|
| `NODE_ENV`               | ✓   | —       | `development` or `production`      |
| `PORT`                   | ✗   | 3001    | Server port                        |
| `DATABASE_URL`           | ✓   | —       | MySQL connection string            |
| `JWT_SECRET`             | ✓   | —       | JWT signing secret (64 chars)      |
| `CORS_ORIGIN`            | ✗   | `*`     | Allowed origins (comma-separated)  |
| `RATE_LIMIT_WINDOW_MS`   | ✗   | 900000  | Rate limit window (ms)             |
| `RATE_LIMIT_MAX_REQUESTS` | ✗  | 1000    | Max requests per window            |
| `LOG_LEVEL`              | ✗   | info    | Logging level                      |

## Default Login Credentials

| Role    | Username        | Password      |
|---------|-----------------|---------------|
| Admin   | admin           | adminmilbos   |
| Teacher | ahmad.fauzi     | gurumilbos    |
| Student | alaric.mizan    | siswamilbos   |
