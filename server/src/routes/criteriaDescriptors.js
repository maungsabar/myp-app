import { Router } from 'express';
import { prisma } from '../db.js';

const router = Router();

// GET /api/criteria-descriptors?subjectId=X&gradeLevel=Y
router.get('/', async (req, res) => {
  try {
    const { subjectId, gradeLevel } = req.query;
    const where = {};
    if (subjectId) where.subjectId = Number(subjectId);
    if (gradeLevel) where.gradeLevel = gradeLevel;

    const descriptors = await prisma.criteriaDescriptor.findMany({
      where,
      orderBy: [{ subjectId: 'asc' }, { gradeLevel: 'asc' }, { criteria: 'asc' }],
    });
    res.json(descriptors);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/criteria-descriptors/:subjectId — get all descriptors for a subject as nested object
router.get('/:subjectId', async (req, res) => {
  try {
    const subjectId = Number(req.params.subjectId);
    const rows = await prisma.criteriaDescriptor.findMany({
      where: { subjectId },
      orderBy: [{ gradeLevel: 'asc' }, { criteria: 'asc' }],
    });

    // Build nested object: { "7": { "A": { title, levels }, "B": ... }, "8": ... }
    const result = {};
    for (const row of rows) {
      if (!result[row.gradeLevel]) result[row.gradeLevel] = {};
      result[row.gradeLevel][row.criteria] = {
        title: row.title,
        levels: row.levels || {},
      };
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/criteria-descriptors/:subjectId — replace all descriptors for a subject
// Body: { "7": { "A": { title, levels }, ... }, "8": { ... } }
router.put('/:subjectId', async (req, res) => {
  try {
    const subjectId = Number(req.params.subjectId);
    const tree = req.body;

    // Delete existing descriptors for this subject
    await prisma.criteriaDescriptor.deleteMany({ where: { subjectId } });

    // Create new descriptors from the tree
    const creates = [];
    for (const [gradeLevel, criteriaMap] of Object.entries(tree)) {
      for (const [criteria, data] of Object.entries(criteriaMap)) {
        creates.push({
          subjectId,
          gradeLevel,
          criteria,
          title: data.title || '',
          levels: data.levels || {},
        });
      }
    }

    if (creates.length > 0) {
      await prisma.criteriaDescriptor.createMany({ data: creates });
    }

    // Return the new tree
    const rows = await prisma.criteriaDescriptor.findMany({ where: { subjectId } });
    const result = {};
    for (const row of rows) {
      if (!result[row.gradeLevel]) result[row.gradeLevel] = {};
      result[row.gradeLevel][row.criteria] = { title: row.title, levels: row.levels };
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
