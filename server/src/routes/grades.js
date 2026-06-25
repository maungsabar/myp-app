import { Router } from 'express';
import { prisma } from '../db.js';

const router = Router();

// GET /api/grades — list with optional filters
router.get('/', async (req, res) => {
  try {
    const { studentId, subjectId, semester, academicYear } = req.query;
    const where = {};
    if (studentId) where.studentId = Number(studentId);
    if (subjectId) where.subjectId = Number(subjectId);
    if (semester) where.semester = Number(semester);
    if (academicYear) where.academicYear = academicYear;

    const grades = await prisma.grade.findMany({
      where,
      include: { student: true, subject: true },
      orderBy: [{ studentId: 'asc' }, { subjectId: 'asc' }],
    });
    res.json(grades);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/grades/:id
router.get('/:id', async (req, res) => {
  try {
    const grade = await prisma.grade.findUnique({
      where: { id: Number(req.params.id) },
      include: { student: true, subject: true },
    });
    if (!grade) return res.status(404).json({ error: 'Grade not found' });
    res.json(grade);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/grades — upsert: create or update based on studentId+subjectId+semester+academicYear
router.post('/', async (req, res) => {
  try {
    const { studentId, subjectId, semester, academicYear, ...scores } = req.body;
    const grade = await prisma.grade.upsert({
      where: {
        studentId_subjectId_semester_academicYear: {
          studentId: Number(studentId),
          subjectId: Number(subjectId),
          semester: Number(semester),
          academicYear,
        },
      },
      update: scores,
      create: { studentId: Number(studentId), subjectId: Number(subjectId), semester: Number(semester), academicYear, ...scores },
    });
    res.json(grade);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/grades/:id
router.put('/:id', async (req, res) => {
  try {
    const grade = await prisma.grade.update({
      where: { id: Number(req.params.id) },
      data: req.body,
    });
    res.json(grade);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/grades/batch — batch upsert multiple grades
router.post('/batch', async (req, res) => {
  try {
    const { grades } = req.body;
    if (!Array.isArray(grades)) return res.status(400).json({ error: 'Expected array of grades' });

    const results = await Promise.all(
      grades.map(g =>
        prisma.grade.upsert({
          where: {
            studentId_subjectId_semester_academicYear: {
              studentId: Number(g.studentId),
              subjectId: Number(g.subjectId),
              semester: Number(g.semester),
              academicYear: g.academicYear,
            },
          },
          update: { scoreA: g.scoreA || 0, scoreB: g.scoreB || 0, scoreC: g.scoreC || 0, scoreD: g.scoreD || 0 },
          create: {
            studentId: Number(g.studentId),
            subjectId: Number(g.subjectId),
            semester: Number(g.semester),
            academicYear: g.academicYear,
            scoreA: g.scoreA || 0,
            scoreB: g.scoreB || 0,
            scoreC: g.scoreC || 0,
            scoreD: g.scoreD || 0,
          },
        })
      )
    );
    res.json({ count: results.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
