import { Router } from 'express';
import { prisma } from '../db.js';

const router = Router();

// GET /api/grade-boundaries — get all boundaries ordered by grade
router.get('/', async (req, res) => {
  try {
    const boundaries = await prisma.gradeBoundary.findMany({
      orderBy: { grade: 'asc' },
    });
    res.json(boundaries);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/grade-boundaries — replace all boundaries
// Body: array of { grade, min, max, label }
router.put('/', async (req, res) => {
  try {
    const boundaries = req.body;
    if (!Array.isArray(boundaries)) {
      return res.status(400).json({ error: 'Expected array of boundaries' });
    }

    // Delete all existing
    await prisma.gradeBoundary.deleteMany();

    // Create new
    for (const b of boundaries) {
      await prisma.gradeBoundary.create({
        data: {
          grade: Number(b.grade),
          min: Number(b.min),
          max: Number(b.max),
          label: b.label || '',
        },
      });
    }

    // Return updated list
    const updated = await prisma.gradeBoundary.findMany({ orderBy: { grade: 'asc' } });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
