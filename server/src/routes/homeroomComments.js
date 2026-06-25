import { Router } from 'express';
import { prisma } from '../db.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { studentId, semester, academicYear } = req.query;
    const where = {};
    if (studentId) where.studentId = Number(studentId);
    if (semester) where.semester = Number(semester);
    if (academicYear) where.academicYear = academicYear;

    const records = await prisma.homeroomComment.findMany({
      where,
      include: { student: true },
      orderBy: { studentId: 'asc' },
    });
    res.json(records);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const record = await prisma.homeroomComment.findUnique({
      where: { id: Number(req.params.id) },
      include: { student: true },
    });
    if (!record) return res.status(404).json({ error: 'Comment not found' });
    res.json(record);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { studentId, semester, academicYear, ...data } = req.body;
    const record = await prisma.homeroomComment.upsert({
      where: {
        studentId_semester_academicYear: {
          studentId: Number(studentId),
          semester: Number(semester),
          academicYear,
        },
      },
      update: data,
      create: { studentId: Number(studentId), semester: Number(semester), academicYear, ...data },
    });
    res.json(record);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const record = await prisma.homeroomComment.update({
      where: { id: Number(req.params.id) },
      data: req.body,
    });
    res.json(record);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
