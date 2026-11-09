import { Router } from 'express';
import { prisma } from '../db.js';

const router = Router();

// Authorization middleware for mutating settings (admin only)
const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Hanya administrator yang memiliki hak akses untuk mengubah pengaturan ini.' });
  }
  next();
};

// Default print settings (titimangsa rapor, attendance config & cover settings)
const DEFAULT_PRINT_SETTINGS = {
  mode: 'semester', // 'semester' | 'fixed' | 'realtime'
  date: new Date().getDate(),
  month: 'December',
  year: new Date().getFullYear(),
  language: 'en', // 'en' | 'id'
  semester1: { date: 20, month: 'December', year: new Date().getFullYear() },
  semester2: { date: 20, month: 'June', year: new Date().getFullYear() },
  showPresentInAttendance: false,
  cover: {
    enabled: true,
    leftLogo: null,
    rightLogo: null,
    customVisual: null,
    title: 'ACADEMIC REPORT CARD',
    subtitle: 'MIDDLE YEARS PROGRAMME',
    motto: 'Inquire-Act-Reflect',
    showMotto: true,
    website: '',
    mypYearMap: {
      7: 'Grade 7 / MYP Year 2',
      8: 'Grade 8 / MYP Year 3',
      9: 'Grade 9 / MYP Year 4',
    },
  },
};

// Default cover letter (kata pengantar kepala sekolah & koordinator MYP)
const DEFAULT_COVER_LETTER = {
  salutation: 'Dear Parents,',
  greeting: 'Assalamu’alaikum warahmatullahi wabarakatuh,',
  paragraphs: [
    'Alhamdulillah, with gratitude to Allah ﷻ, we are pleased to share with you the MYP Semester Report for the academic year {academicYear}. This report is designed to provide you with a clear picture of your child’s learning progress across all subject groups within the Middle Years Programme (MYP).',
    'Our aim is to help you, together with your child and their teachers, reflect on learning achievements and plan meaningful steps for continuous academic, personal, and spiritual growth in line with our vision of nurturing future Islamic leaders who embody the values of faith, knowledge, and good character (iman, ilmu, dan akhlak).',
    'In the MYP, your child’s progress is assessed through criteria (up to A, B, C, D depending on the subject) for each subject. Each criterion is scored out of 8 points, and the total is converted to a final grade (1–7) according to MYP grade boundaries that are scaled to the number of criteria assessed.',
    'At this stage of the academic year, some subjects may have assessed all four criteria, while others may have assessed fewer. Therefore, if a subject has not yet covered all four criteria, a final grade may not be awarded this semester.',
    'You will also find teacher reflections on how your child has demonstrated the IB Learner Profile attributes, integrated with the values of Islam that guide our school culture. Details about grade boundaries and learner profiles are included at the end of this report.',
    'We encourage you to use this report as a chance to celebrate progress and discuss areas for further improvement with your child. Should you wish to have a deeper conversation about your child’s development, you are warmly invited to make an appointment with the respective subject or homeroom teachers.',
    'Thank you for your continuous support and partnership in your child’s educational journey.',
  ],
  closingGreeting: 'Wassalamu’alaikum warahmatullahi wabarakatuh,',
  closingSignoff: 'Kind regards,',
  principalTitle: 'Principal',
  coordinatorTitle: 'MYP Coordinator',
  principalSignature: null,
  coordinatorSignature: null,
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
router.put('/ib-profile-logo', requireAdmin, async (req, res) => {
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
router.delete('/ib-profile-logo', requireAdmin, async (req, res) => {
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
    if (!setting && req.params.key === 'coverLetter') {
      return res.json({ key: 'coverLetter', value: DEFAULT_COVER_LETTER });
    }
    res.json({ key: req.params.key, value: setting?.value || null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:key', requireAdmin, async (req, res) => {
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
