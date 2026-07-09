import { Router } from 'express';
import crypto from 'crypto';
import { prisma } from '../db.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
const DEFAULT_PASSWORDS = {
  admin: 'adminmilbos',
  coordinator: 'adminmilbos',
  homeroom: 'gurumilbos',
  subject: 'gurumilbos',
};

// Generate username from full email, fallback to name if no email
function generateUsername(teacher) {
  if (teacher.email) {
    return teacher.email.toLowerCase().trim();
  }
  return teacher.name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '.')
    .substring(0, 50);
}

// Auto-create user account for a teacher
async function createTeacherUser(teacher) {
  try {
    const username = generateUsername(teacher);
    // Check if username already exists
    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) return; // User already exists, skip
    const role = teacher.role || 'subject';
    await prisma.user.create({
      data: {
        username,
        name: teacher.name,
        role,
        email: teacher.email || null,
        password: DEFAULT_PASSWORDS[role] || 'gurumilbos',
        isDefaultPassword: true,
      },
    });
  } catch (err) {
    console.warn('Failed to auto-create teacher user:', err.message);
  }
}

router.get('/', async (req, res) => {
  try {
    const { role, search } = req.query;
    const where = {};
    if (role) where.role = role;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { nip: { contains: search } },
      ];
    }
    const teachers = await prisma.teacher.findMany({ where, orderBy: { name: 'asc' } });
    res.json(teachers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/teachers/me — get teacher record for current logged-in user
router.get('/me', async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
    const teacher = await prisma.teacher.findFirst({ where: { name: req.user.name } });
    if (!teacher) return res.status(404).json({ error: 'Teacher record not found for this user' });
    res.json(teacher);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const teacher = await prisma.teacher.findUnique({ where: { id: Number(req.params.id) } });
    if (!teacher) return res.status(404).json({ error: 'Teacher not found' });
    res.json(teacher);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const teacher = await prisma.teacher.create({ data: req.body });
    await createTeacherUser(teacher);
    res.status(201).json(teacher);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/bulk', async (req, res) => {
  try {
    const { teachers } = req.body;
    if (!Array.isArray(teachers)) return res.status(400).json({ error: 'Expected array' });
    const created = await prisma.teacher.createMany({ data: teachers, skipDuplicates: true });
    // Auto-create user accounts for imported teachers
    const allTeachers = await prisma.teacher.findMany({
      where: { nip: { in: teachers.map(t => t.nip) } },
    });
    for (const t of allTeachers) {
      await createTeacherUser(t);
    }
    res.status(201).json({ count: created.count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const teacher = await prisma.teacher.update({
      where: { id: Number(req.params.id) },
      data: req.body,
    });

    // Auto-sync: update corresponding user's role if teacher role changed
    if (req.body.role) {
      const user = await prisma.user.findFirst({ where: { name: teacher.name } });
      if (user && user.role !== req.body.role) {
        await prisma.user.update({
          where: { id: user.id },
          data: { role: req.body.role },
        });
      }
    }

    res.json(teacher);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/teachers/bulk-delete — delete multiple teachers at once
router.post('/bulk-delete', async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'Expected non-empty array of ids' });
    }
    const numericIds = ids.map(Number).filter(n => !isNaN(n));
    const result = await prisma.teacher.deleteMany({ where: { id: { in: numericIds } } });
    res.json({ success: true, deletedCount: result.count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await prisma.teacher.delete({ where: { id: Number(req.params.id) } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
