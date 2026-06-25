import { Router } from 'express';
import { prisma } from '../db.js';

const router = Router();

// GET /api/school-profile
router.get('/', async (req, res) => {
  try {
    let profile = await prisma.schoolProfile.findUnique({ where: { id: 1 } });
    if (!profile) {
      profile = await prisma.schoolProfile.create({
        data: { id: 1, name: '', address: '', phone: '', email: '', principal: '', mypCoordinator: '' },
      });
    }
    res.json(profile);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/school-profile
router.put('/', async (req, res) => {
  try {
    const profile = await prisma.schoolProfile.upsert({
      where: { id: 1 },
      update: req.body,
      create: { id: 1, ...req.body },
    });
    res.json(profile);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
