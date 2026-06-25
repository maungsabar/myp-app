import { Router } from 'express';
import { prisma } from '../db.js';

const router = Router();

// GET /api/classes?level=X&academicYearId=Y
router.get('/', async (req, res) => {
  try {
    const { level, academicYearId } = req.query;
    const where = {};
    if (level) where.level = Number(level);

    // Filter by academicYearId (default: active year)
    if (academicYearId) {
      where.academicYearId = Number(academicYearId);
    } else {
      const activeYear = await prisma.academicYear.findFirst({ where: { isActive: true } });
      if (activeYear) where.academicYearId = activeYear.id;
    }

    const classes = await prisma.class.findMany({
      where,
      include: { homeroomTeacher: true, academicYear: true },
      orderBy: { name: 'asc' },
    });
    res.json(classes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const cls = await prisma.class.findUnique({
      where: { id: Number(req.params.id) },
      include: { homeroomTeacher: true, academicYear: true },
    });
    if (!cls) return res.status(404).json({ error: 'Class not found' });
    res.json(cls);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/classes — create class (auto-assigns to active year if no academicYearId provided)
router.post('/', async (req, res) => {
  try {
    let data = { ...req.body };
    if (!data.academicYearId) {
      const activeYear = await prisma.academicYear.findFirst({ where: { isActive: true } });
      if (activeYear) data.academicYearId = activeYear.id;
    }
    const cls = await prisma.class.create({ data });
    res.status(201).json(cls);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const cls = await prisma.class.update({
      where: { id: Number(req.params.id) },
      data: req.body,
    });
    res.json(cls);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await prisma.class.delete({ where: { id: Number(req.params.id) } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
