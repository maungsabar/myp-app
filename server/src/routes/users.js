import { Router } from 'express';
import crypto from 'crypto';
import { prisma } from '../db.js';

const router = Router();

const DEFAULT_PASSWORDS = {
  admin: 'adminmilbos',
  coordinator: 'adminmilbos',
  homeroom: 'gurumilbos',
  subject: 'gurumilbos',
  student: 'siswamilbos',
};

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// User select fields (safe to expose)
const userSelect = {
  id: true, username: true, name: true, role: true,
  email: true, lastLogin: true, isDefaultPassword: true,
};

// Enrich user response with passwordDisplay
function enrichUser(user) {
  return {
    ...user,
    passwordDisplay: user.isDefaultPassword
      ? (DEFAULT_PASSWORDS[user.role] || 'default')
      : '••••••••',
  };
}

// GET /api/users — list all with password display info
router.get('/', async (req, res) => {
  try {
    const { role, search } = req.query;
    const where = {};
    if (role) where.role = role;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { username: { contains: search } },
        { email: { contains: search } },
      ];
    }
    const users = await prisma.user.findMany({ where, select: userSelect, orderBy: { name: 'asc' } });
    res.json(users.map(enrichUser));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/users/:id
router.get('/:id', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: Number(req.params.id) },
      select: userSelect,
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(enrichUser(user));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/users — create user
router.post('/', async (req, res) => {
  try {
    const { password, ...rest } = req.body;
    const data = {
      ...rest,
      password: password || DEFAULT_PASSWORDS[rest.role] || 'default',
      isDefaultPassword: true,
    };
    const user = await prisma.user.create({ data, select: userSelect });
    res.status(201).json(enrichUser(user));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/users/:id — update user (non-password fields)
router.put('/:id', async (req, res) => {
  try {
    const { password, isDefaultPassword, ...data } = req.body;
    const user = await prisma.user.update({
      where: { id: Number(req.params.id) },
      data,
      select: userSelect,
    });
    res.json(enrichUser(user));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/users/:id/reset-password — reset to default password
router.put('/:id/reset-password', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: Number(req.params.id) } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const defaultPass = DEFAULT_PASSWORDS[user.role] || 'default';
    const updated = await prisma.user.update({
      where: { id: Number(req.params.id) },
      data: { password: defaultPass, isDefaultPassword: true },
      select: userSelect,
    });
    res.json(enrichUser(updated));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/users/:id/change-password — change password (hashes it)
router.put('/:id/change-password', async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'Password minimal 6 karakter' });
    }
    const updated = await prisma.user.update({
      where: { id: Number(req.params.id) },
      data: { password: hashPassword(newPassword), isDefaultPassword: false },
      select: userSelect,
    });
    res.json(enrichUser(updated));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/users/bulk-delete — delete multiple users at once
router.post('/bulk-delete', async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'Expected non-empty array of ids' });
    }
    const numericIds = ids.map(Number).filter(n => !isNaN(n));
    const result = await prisma.user.deleteMany({ where: { id: { in: numericIds } } });
    res.json({ success: true, deletedCount: result.count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/users/:id
router.delete('/:id', async (req, res) => {
  try {
    await prisma.user.delete({ where: { id: Number(req.params.id) } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
