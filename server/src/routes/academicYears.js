import { Router } from 'express';
import { prisma } from '../db.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const years = await prisma.academicYear.findMany({ orderBy: { year: 'desc' } });
    res.json(years);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const year = await prisma.academicYear.findUnique({ where: { id: Number(req.params.id) } });
    if (!year) return res.status(404).json({ error: 'Academic year not found' });
    res.json(year);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const year = await prisma.academicYear.create({ data: req.body });
    res.status(201).json(year);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const year = await prisma.academicYear.update({
      where: { id: Number(req.params.id) },
      data: req.body,
    });
    res.json(year);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/academic-years/:id/set-active — set this year as active, deactivate others
router.put('/:id/set-active', async (req, res) => {
  try {
    const id = Number(req.params.id);
    await prisma.academicYear.updateMany({ data: { isActive: false } });
    const year = await prisma.academicYear.update({
      where: { id },
      data: { isActive: true },
    });
    res.json(year);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const year = await prisma.academicYear.findUnique({ where: { id: Number(req.params.id) } });
    if (year?.isActive) return res.status(400).json({ error: 'Cannot delete the active academic year' });
    await prisma.academicYear.delete({ where: { id: Number(req.params.id) } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
