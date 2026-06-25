import { Router } from 'express';
import { prisma } from '../db.js';

const router = Router();

// GET /api/settings/ib-profile-logo
router.get('/ib-profile-logo', async (req, res) => {
  try {
    const setting = await prisma.appSetting.findUnique({ where: { key: 'ibProfileLogo' } });
    res.json({ logo: setting?.value || null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/settings/ib-profile-logo — set logo (base64 data URL)
router.put('/ib-profile-logo', async (req, res) => {
  try {
    const { logo } = req.body;
    const setting = await prisma.appSetting.upsert({
      where: { key: 'ibProfileLogo' },
      update: { value: logo },
      create: { key: 'ibProfileLogo', value: logo },
    });
    res.json({ logo: setting.value });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/settings/ib-profile-logo — remove logo
router.delete('/ib-profile-logo', async (req, res) => {
  try {
    await prisma.appSetting.upsert({
      where: { key: 'ibProfileLogo' },
      update: { value: null },
      create: { key: 'ibProfileLogo', value: null },
    });
    res.json({ logo: null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Generic settings endpoints
router.get('/:key', async (req, res) => {
  try {
    const setting = await prisma.appSetting.findUnique({ where: { key: req.params.key } });
    res.json({ key: req.params.key, value: setting?.value || null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:key', async (req, res) => {
  try {
    const setting = await prisma.appSetting.upsert({
      where: { key: req.params.key },
      update: { value: req.body.value },
      create: { key: req.params.key, value: req.body.value },
    });
    res.json(setting);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
