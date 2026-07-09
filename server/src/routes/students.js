import { Router } from 'express';
import { prisma } from '../db.js';

const router = Router();
const DEFAULT_STUDENT_PASSWORD = 'siswamilbos';

// Generate username from NIS/NISN
function generateStudentUsername(nis) {
  return nis.toLowerCase().replace(/[^a-z0-9]/g, '');
}

// Auto-create user account for a student
async function createStudentUser(student) {
  try {
    const username = generateStudentUsername(student.nis);
    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) return;
    await prisma.user.create({
      data: {
        username,
        name: student.name,
        role: 'student',
        email: student.parentEmail || null,
        password: DEFAULT_STUDENT_PASSWORD,
        isDefaultPassword: true,
      },
    });
  } catch (err) {
    console.warn('Failed to auto-create student user:', err.message);
  }
}

// GET /api/students — list all, optional filters
router.get('/', async (req, res) => {
  try {
    const { status, class: className, search, academicYearId } = req.query;
    const where = {};
    if (status) where.status = status;
    if (className) where.class = className;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { nis: { contains: search } },
      ];
    }

    // Filter by academic year via StudentAcademicYear
    if (academicYearId) {
      where.academicYears = {
        some: { academicYearId: Number(academicYearId), status: 'active' }
      };
    }

    const students = await prisma.student.findMany({ where, orderBy: { name: 'asc' } });
    res.json(students);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/students/:id
router.get('/:id', async (req, res) => {
  try {
    const student = await prisma.student.findUnique({ where: { id: Number(req.params.id) } });
    if (!student) return res.status(404).json({ error: 'Student not found' });
    res.json(student);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/students — create single + auto-register to active academic year
router.post('/', async (req, res) => {
  try {
    const student = await prisma.student.create({ data: req.body });
    await createStudentUser(student);

    // Auto-register to active academic year
    const activeYear = await prisma.academicYear.findFirst({ where: { isActive: true } });
    if (activeYear) {
      try {
        await prisma.studentAcademicYear.create({
          data: { studentId: student.id, academicYearId: activeYear.id, className: student.class, status: 'active' }
        });
      } catch {} // skip if already exists
    }

    res.status(201).json(student);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/students/bulk — bulk import
router.post('/bulk', async (req, res) => {
  try {
    const { students } = req.body;
    if (!Array.isArray(students)) return res.status(400).json({ error: 'Expected array of students' });
    const created = await prisma.student.createMany({ data: students, skipDuplicates: true });
    // Auto-create user accounts and register to active academic year
    const allStudents = await prisma.student.findMany({
      where: { nis: { in: students.map(s => s.nis) } },
    });
    const activeYear = await prisma.academicYear.findFirst({ where: { isActive: true } });
    for (const s of allStudents) {
      await createStudentUser(s);
      // Auto-register to active academic year
      if (activeYear) {
        try {
          await prisma.studentAcademicYear.create({
            data: { studentId: s.id, academicYearId: activeYear.id, className: s.class, status: 'active' }
          });
        } catch {} // skip if already exists
      }
    }
    res.status(201).json({ count: created.count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/students/:id
router.put('/:id', async (req, res) => {
  try {
    const student = await prisma.student.update({
      where: { id: Number(req.params.id) },
      data: req.body,
    });
    res.json(student);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/students/bulk-delete — delete multiple students at once
router.post('/bulk-delete', async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'Expected non-empty array of ids' });
    }
    const numericIds = ids.map(Number).filter(n => !isNaN(n));
    const result = await prisma.student.deleteMany({ where: { id: { in: numericIds } } });
    res.json({ success: true, deletedCount: result.count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/students/:id
router.delete('/:id', async (req, res) => {
  try {
    await prisma.student.delete({ where: { id: Number(req.params.id) } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
