import { Router } from 'express';
import { prisma } from '../db.js';

const router = Router();

// GET /api/grade-progress?academicYearId=X&level=7&className=7A
// Returns progress data for grade progress page
router.get('/', async (req, res) => {
  try {
    const { academicYearId, level, className } = req.query;

    // Determine academic year
    let ayId = academicYearId ? Number(academicYearId) : null;
    if (!ayId) {
      const activeYear = await prisma.academicYear.findFirst({ where: { isActive: true } });
      if (activeYear) ayId = activeYear.id;
    }
    if (!ayId) return res.json({ classes: [], year: null });

    const activeYear = await prisma.academicYear.findUnique({ where: { id: ayId } });
    const yearStr = activeYear?.year || '';

    // Get classes for this academic year (optionally filtered by level)
    const classWhere = { academicYearId: ayId };
    if (level) classWhere.level = Number(level);
    if (className) classWhere.name = className;

    const classes = await prisma.class.findMany({
      where: classWhere,
      include: { homeroomTeacher: true },
      orderBy: { name: 'asc' },
    });

    // Get all subjects
    const subjects = await prisma.subject.findMany({ orderBy: { name: 'asc' } });

    // Get all students registered for this academic year
    const studentRegistrations = await prisma.studentAcademicYear.findMany({
      where: { academicYearId: ayId, status: 'active' },
      include: { student: true },
    });

    // Group students by class
    const studentsByClass = {};
    studentRegistrations.forEach(say => {
      if (!studentsByClass[say.className]) studentsByClass[say.className] = [];
      studentsByClass[say.className].push(say.student);
    });

    // Get all grades for this academic year
    const allGrades = await prisma.grade.findMany({
      where: { academicYear: yearStr },
    });

    // Build class-level progress data
    const classProgress = classes.map(cls => {
      const classStudents = studentsByClass[cls.name] || [];
      const totalStudents = classStudents.length;
      const totalSubjects = subjects.length;

      if (totalStudents === 0 || totalSubjects === 0) {
        return {
          className: cls.name,
          level: cls.level,
          homeroomTeacher: cls.homeroomTeacher?.name || '-',
          totalStudents,
          totalSubjects,
          gradedCount: 0,
          totalPossible: 0,
          progressPercent: 0,
          subjects: [],
        };
      }

      // Count graded entries for this class
      const studentIds = classStudents.map(s => s.id);
      const classGrades = allGrades.filter(g => studentIds.includes(g.studentId));
      const gradedCount = classGrades.length;
      const totalPossible = totalStudents * totalSubjects;
      const progressPercent = totalPossible > 0 ? Math.round((gradedCount / totalPossible) * 100) : 0;

      // Build per-subject progress
      const subjectProgress = subjects.map(sub => {
        const subjectGrades = classGrades.filter(g => g.subjectId === sub.id);
        const gradedStudents = subjectGrades.length;
        const subPercent = totalStudents > 0 ? Math.round((gradedStudents / totalStudents) * 100) : 0;

        // Find teacher for this subject+class from teaching assignments
        const assignment = null; // Will be fetched separately

        return {
          subjectId: sub.id,
          subjectName: sub.shortName,
          gradedStudents,
          totalStudents,
          progressPercent: subPercent,
        };
      });

      return {
        className: cls.name,
        level: cls.level,
        homeroomTeacher: cls.homeroomTeacher?.name || '-',
        totalStudents,
        totalSubjects,
        gradedCount,
        totalPossible,
        progressPercent,
        subjects: subjectProgress,
      };
    });

    // Fetch teaching assignments for teacher names
    const assignments = await prisma.teachingAssignment.findMany({
      where: { academicYearId: ayId },
      include: { teacher: true, subject: true },
    });

    // Attach teacher names to subject progress
    classProgress.forEach(cp => {
      cp.subjects.forEach(sp => {
        const assignment = assignments.find(
          a => a.className === cp.className && a.subjectId === sp.subjectId
        );
        sp.teacherName = assignment?.teacher?.name || '-';
      });
    });

    res.json({ classes: classProgress, year: yearStr });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
