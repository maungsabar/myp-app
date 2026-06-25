import { Router } from 'express';
import { prisma } from '../db.js';

const router = Router();

// GET /api/learner-profiles — list all, ordered
router.get('/', async (req, res) => {
  try {
    const profiles = await prisma.learnerProfile.findMany({ orderBy: { order: 'asc' } });
    res.json(profiles);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/learner-profiles — replace all profiles (full save)
// Body: array of { name, description }
router.put('/', async (req, res) => {
  try {
    const profiles = req.body;
    if (!Array.isArray(profiles)) return res.status(400).json({ error: 'Expected array' });

    // Delete all existing
    await prisma.learnerProfile.deleteMany({});

    // Create new with order
    const data = profiles.map((p, idx) => ({
      order: idx + 1,
      name: p.name,
      description: p.description,
    }));

    if (data.length > 0) {
      await prisma.learnerProfile.createMany({ data });
    }

    const result = await prisma.learnerProfile.findMany({ orderBy: { order: 'asc' } });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
