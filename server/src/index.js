import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import { prisma } from './db.js';
import { authenticate, authorize } from './middleware/auth.js';

// __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import authRouter from './routes/auth.js';
import studentsRouter from './routes/students.js';
import teachersRouter from './routes/teachers.js';
import classesRouter from './routes/classes.js';
import subjectsRouter from './routes/subjects.js';
import gradesRouter from './routes/grades.js';
import attendanceRouter from './routes/attendance.js';
import homeroomCommentsRouter from './routes/homeroomComments.js';
import academicYearsRouter from './routes/academicYears.js';
import schoolProfileRouter from './routes/schoolProfile.js';
import usersRouter from './routes/users.js';
import alumniRouter from './routes/alumni.js';
import criteriaDescriptorsRouter from './routes/criteriaDescriptors.js';
import learnerProfilesRouter from './routes/learnerProfiles.js';
import settingsRouter from './routes/settings.js';
import dashboardRouter from './routes/dashboard.js';
import teachingAssignmentsRouter from './routes/teachingAssignments.js';
import gradeBoundariesRouter from './routes/gradeBoundaries.js';
import gradeProgressRouter from './routes/gradeProgress.js';

const app = express();
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

// ─── Security Middleware ─────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

const corsOrigin = isProduction && process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(s => s.trim())
  : '*';
app.use(cors({ origin: corsOrigin }));

const limiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Terlalu banyak request. Coba lagi nanti.' },
});
app.use('/api/', limiter);

// Body parser
app.use(express.json({ limit: '10mb' }));

// ─── Public Routes (no auth required) ───────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Auth routes (login is public)
app.use('/api/auth', authRouter);

// Public school profile (for login page logo/name)
app.get('/api/school-profile/public', async (req, res) => {
  try {
    const { prisma } = await import('./db.js');
    let profile = await prisma.schoolProfile.findUnique({ where: { id: 1 } });
    if (!profile) profile = { name: '', logo: null };
    res.json({ name: profile.name, logo: profile.logo });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Protected Routes (auth required) ───────────────────────────
app.use('/api/students', authenticate, authorize('admin', 'coordinator', 'homeroom', 'subject', 'student'), studentsRouter);
app.use('/api/teachers', authenticate, authorize('admin', 'coordinator', 'homeroom', 'subject'), teachersRouter);
app.use('/api/classes', authenticate, authorize('admin', 'coordinator', 'homeroom', 'subject', 'student'), classesRouter);
app.use('/api/subjects', authenticate, authorize('admin', 'coordinator', 'homeroom', 'subject', 'student'), subjectsRouter);
app.use('/api/grades', authenticate, authorize('admin', 'coordinator', 'homeroom', 'subject', 'student'), gradesRouter);
app.use('/api/attendance', authenticate, authorize('admin', 'coordinator', 'homeroom', 'student'), attendanceRouter);
app.use('/api/homeroom-comments', authenticate, authorize('admin', 'coordinator', 'homeroom', 'student'), homeroomCommentsRouter);
app.use('/api/academic-years', authenticate, authorize('admin', 'coordinator', 'homeroom', 'subject', 'student'), academicYearsRouter);
app.use('/api/school-profile', authenticate, authorize('admin', 'coordinator', 'homeroom', 'subject', 'student'), schoolProfileRouter);
app.use('/api/users', authenticate, authorize('admin'), usersRouter);
app.use('/api/alumni', authenticate, authorize('admin'), alumniRouter);
app.use('/api/criteria-descriptors', authenticate, authorize('admin', 'coordinator', 'homeroom', 'subject', 'student'), criteriaDescriptorsRouter);
app.use('/api/learner-profiles', authenticate, authorize('admin', 'coordinator', 'homeroom', 'subject', 'student'), learnerProfilesRouter);
app.use('/api/settings', authenticate, authorize('admin'), settingsRouter);
app.use('/api/dashboard', authenticate, dashboardRouter);
app.use('/api/teaching-assignments', authenticate, authorize('admin', 'coordinator', 'homeroom', 'subject'), teachingAssignmentsRouter);
app.use('/api/grade-boundaries', authenticate, authorize('admin', 'coordinator', 'student'), gradeBoundariesRouter);
app.use('/api/grade-progress', authenticate, authorize('admin', 'coordinator', 'homeroom'), gradeProgressRouter);

// ─── Production: Serve Frontend Static Files ────────────────────
if (isProduction) {
  const DIST_DIR = path.resolve(__dirname, '../../dist');
  app.use(express.static(DIST_DIR));

  // SPA fallback — all non-API GET requests serve index.html
  app.get('*', (req, res) => {
    res.sendFile(path.join(DIST_DIR, 'index.html'));
  });
}

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`IB-MYP API server running on localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
