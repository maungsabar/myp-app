import { Router } from 'express';
import { prisma } from '../db.js';

const router = Router();

// GET /api/teaching-assignments?className=8A&academicYearId=Y
router.get('/', async (req, res) => {
  try {
    const { className, academicYearId } = req.query;
    const where = {};
    if (className) where.className = className;

    // Filter by academicYearId (default: active year)
    if (academicYearId) {
      where.academicYearId = Number(academicYearId);
    } else {
      const activeYear = await prisma.academicYear.findFirst({ where: { isActive: true } });
      if (activeYear) where.academicYearId = activeYear.id;
    }

    const assignments = await prisma.teachingAssignment.findMany({
      where,
      include: { teacher: true, subject: true, academicYear: true },
      orderBy: [{ className: 'asc' }, { subject: { name: 'asc' } }],
    });
    res.json(assignments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/teaching-assignments — assign teacher (auto-assigns to active year)
router.post('/', async (req, res) => {
  try {
    const { className, subjectId, teacherId, academicYearId } = req.body;

    let ayId = academicYearId ? Number(academicYearId) : null;
    if (!ayId) {
      const activeYear = await prisma.academicYear.findFirst({ where: { isActive: true } });
      if (activeYear) ayId = activeYear.id;
    }

    // Delete existing assignment for this class+subject in this year (if any)
    await prisma.teachingAssignment.deleteMany({
      where: { className, subjectId: Number(subjectId), academicYearId: ayId },
    });

    const assignment = await prisma.teachingAssignment.create({
      data: {
        className,
        subjectId: Number(subjectId),
        teacherId: Number(teacherId),
        academicYearId: ayId,
      },
      include: { teacher: true, subject: true, academicYear: true },
    });
    res.status(201).json(assignment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/teaching-assignments/:id
router.put('/:id', async (req, res) => {
  try {
    const { teacherId } = req.body;
    const assignment = await prisma.teachingAssignment.update({
      where: { id: Number(req.params.id) },
      data: { teacherId: Number(teacherId) },
      include: { teacher: true, subject: true, academicYear: true },
    });
    res.json(assignment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/teaching-assignments/:id
router.delete('/:id', async (req, res) => {
  try {
    await prisma.teachingAssignment.delete({ where: { id: Number(req.params.id) } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
