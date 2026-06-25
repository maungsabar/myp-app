import { Router } from 'express';
import { prisma } from '../db.js';
import { calculateGradeDynamic, getCriteriaCount, getCriteriaKeys } from '../utils/gradeHelpers.js';

const router = Router();

// GET /api/dashboard/stats — aggregated statistics
router.get('/stats', async (req, res) => {
  try {
    const [
      studentCount,
      teacherCount,
      subjectCount,
      classCount,
      alumniCount,
      grades,
      subjects,
      students,
      activeYear,
    ] = await Promise.all([
      prisma.student.count({ where: { status: 'active' } }),
      prisma.teacher.count(),
      prisma.subject.count(),
      prisma.class.count(),
      prisma.alumni.count(),
      prisma.grade.findMany({ include: { subject: true } }),
      prisma.subject.findMany(),
      prisma.student.findMany(),
      prisma.academicYear.findFirst({ where: { isActive: true } }),
    ]);

    // Compute average MYP grade
    let avgGrade = 0;
    if (grades.length > 0) {
      const totals = grades.map(g => {
        const subject = subjects.find(s => s.id === g.subjectId);
        const student = students.find(s => s.id === g.studentId);
        const gradeLevel = student ? parseInt(student.class) : null;
        const cc = getCriteriaCount(subject, gradeLevel);
        const keys = getCriteriaKeys(cc);
        const sum = keys.reduce((acc, k) => acc + (g[`score${k}`] || 0), 0);
        return calculateGradeDynamic(sum, cc) || 0;
      });
      avgGrade = (totals.reduce((a, b) => a + b, 0) / totals.length).toFixed(1);
    }

    res.json({
      students: studentCount,
      teachers: teacherCount,
      subjects: subjectCount,
      classes: classCount,
      alumni: alumniCount,
      avgGrade: Number(avgGrade),
      activeYear: activeYear?.year || null,
      activeSemester: activeYear?.activeSemester || null,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
