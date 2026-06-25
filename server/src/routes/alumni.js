import { Router } from 'express';
import { prisma } from '../db.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { graduationYear, search } = req.query;
    const where = {};
    if (graduationYear) where.graduationYear = graduationYear;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { nis: { contains: search } },
      ];
    }
    const alumni = await prisma.alumni.findMany({ where, orderBy: { name: 'asc' } });
    res.json(alumni);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const alumni = await prisma.alumni.create({ data: req.body });
    res.status(201).json(alumni);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/alumni/bulk — bulk create (from promote class)
router.post('/bulk', async (req, res) => {
  try {
    const { alumni } = req.body;
    if (!Array.isArray(alumni)) return res.status(400).json({ error: 'Expected array' });
    const created = await prisma.alumni.createMany({ data: alumni });
    res.status(201).json({ count: created.count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
