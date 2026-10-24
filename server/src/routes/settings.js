import { Router } from 'express';
import { prisma } from '../db.js';

const router = Router();

// Authorization middleware for mutating settings
const requireStaff = (req, res, next) => {
  if (!['admin', 'coordinator', 'homeroom'].includes(req.user?.role)) {
    return res.status(403).json({ error: 'Anda tidak memiliki hak akses untuk mengubah pengaturan ini.' });
  }
  next();
};

// Default print settings (titimangsa rapor)
const DEFAULT_PRINT_SETTINGS = {
  mode: 'semester', // 'semester' | 'fixed' | 'realtime'
  month: 'December',
  year: new Date().getFullYear(),
  language: 'en', // 'en' | 'id'
  semester1: { month: 'December', year: new Date().getFullYear() },
  semester2: { month: 'June', year: new Date().getFullYear() },
};

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
router.put('/ib-profile-logo', requireStaff, async (req, res) => {
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
router.delete('/ib-profile-logo', requireStaff, async (req, res) => {
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
    if (!setting && req.params.key === 'printSettings') {
      return res.json({ key: 'printSettings', value: DEFAULT_PRINT_SETTINGS });
    }
    res.json({ key: req.params.key, value: setting?.value || null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:key', requireStaff, async (req, res) => {
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
