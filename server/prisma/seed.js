import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const forceReset = process.argv.includes('--force');

// ─── SEED DATA ──────────────────────────────────────────────────────

const students = [
  { nis: "0112301194", name: "Alaric Aksara Mizan", class: "8A", gender: "L", birthDate: "2012-03-15", parentEmail: "parent@email.com", status: "active" },
  { nis: "0112301195", name: "Aisyah Putri Ramadhani", class: "8A", gender: "P", birthDate: "2012-01-22", parentEmail: "parent@email.com", status: "active" },
  { nis: "0112301196", name: "Muhammad Faisal Rahman", class: "8A", gender: "L", birthDate: "2012-05-10", parentEmail: "parent@email.com", status: "active" },
  { nis: "0112301197", name: "Zahra Aulia Salsabila", class: "8B", gender: "P", birthDate: "2012-07-08", parentEmail: "parent@email.com", status: "active" },
  { nis: "0112301198", name: "Ahmad Dzulfiqar Pratama", class: "8B", gender: "L", birthDate: "2012-11-30", parentEmail: "parent@email.com", status: "active" },
  { nis: "0112301199", name: "Khadijah Nur Azizah", class: "8B", gender: "P", birthDate: "2012-04-18", parentEmail: "parent@email.com", status: "active" },
  { nis: "0112301200", name: "Umar Hadi Saputra", class: "9A", gender: "L", birthDate: "2011-09-25", parentEmail: "parent@email.com", status: "active" },
  { nis: "0112301201", name: "Fatimah Zahra Maharani", class: "9A", gender: "P", birthDate: "2011-12-14", parentEmail: "parent@email.com", status: "active" },
];

const teachers = [
  { nip: "198501012010011001", name: "Fadhli Darmawan, S.Pd.", role: "admin", subject: null, homeroom: null, email: "fadhli@school.id" },
  { nip: "199002152015032001", name: "Zahra Nadia Sholiha, S.Pd.", role: "admin", subject: null, homeroom: null, email: "zahra@school.id" },
  { nip: "198805102012011002", name: "Ahmad Fauzi, S.Pd.", role: "homeroom", subject: "Mathematics", homeroom: "8A", email: "ahmad@school.id" },
  { nip: "199203202016012001", name: "Siti Nurhaliza, M.Pd.", role: "subject", subject: "Language and Literature: Bahasa Indonesia", homeroom: null, email: "siti@school.id" },
  { nip: "198712152011011003", name: "David Thompson, M.Ed.", role: "subject", subject: "Language Acquisition: English", homeroom: null, email: "david@school.id" },
  { nip: "199108252015012002", name: "Dewi Kartika, S.Si.", role: "subject", subject: "Sciences", homeroom: null, email: "dewi@school.id" },
  { nip: "198604182010012003", name: "Rina Wulandari, S.Pd.", role: "homeroom", subject: "Individuals and Societies", homeroom: "8B", email: "rina@school.id" },
  { nip: "199306122017011001", name: "Bagus Prasetyo, S.Sn.", role: "subject", subject: "Arts: Visual/Performing", homeroom: null, email: "bagus@school.id" },
];

const classes = [
  { name: "7A", level: 7, suffix: "A", capacity: 30 },
  { name: "7B", level: 7, suffix: "B", capacity: 30 },
  { name: "8A", level: 8, suffix: "A", capacity: 30 },
  { name: "8B", level: 8, suffix: "B", capacity: 30 },
  { name: "9A", level: 9, suffix: "A", capacity: 30 },
  { name: "9B", level: 9, suffix: "B", capacity: 30 },
];

const subjects = [
  { name: "Language and Literature: Bahasa Indonesia", category: "Language and Literature", shortName: "Bahasa Indonesia" },
  { name: "Language Acquisition: English Level 1/2/3/4", category: "Language Acquisition", shortName: "English" },
  { name: "Mathematics", category: "Mathematics", shortName: "Mathematics" },
  { name: "Sciences", category: "Sciences", shortName: "Sciences" },
  { name: "Individuals and Societies", category: "Individuals and Societies", shortName: "Ind. & Societies" },
  { name: "Arts: Visual/Performing", category: "Arts", shortName: "Arts" },
  { name: "Physical and Health Education", category: "Physical and Health Education", shortName: "PHE", criteriaConfig: { default: 4, 7: 3 } },
  { name: "Design", category: "Design", shortName: "Design" },
  { name: "Community Project", category: "Community Project", shortName: "Community Project", availableGrades: [9], criteriaConfig: { default: 4 } },
  { name: "Interdisciplinary Learning (Math+Design)", category: "Mathematics", shortName: "Interdisciplinary", availableGrades: [7], criteriaConfig: { default: 3 } },
];

const academicYears = [
  { year: "2024/2025", activeSemester: 2, isActive: false, semester1Name: "First Semester", semester2Name: "Second Semester" },
  { year: "2025/2026", activeSemester: 2, isActive: true, semester1Name: "First Semester", semester2Name: "Second Semester" },
];

const schoolProfile = {
  name: "IB Islamic School",
  address: "Jl. Pendidikan No. 1, Jakarta",
  phone: "(021) 1234567",
  email: "info@ibischool.id",
  principal: "Dr. H. Muhammad Ridwan, M.Pd.",
  mypCoordinator: "Zahra Nadia Sholiha, S.Pd.",
};

const users = [
  { username: "admin", name: "Fadhli Darmawan, S.Pd.", role: "admin", email: "fadhli@school.id", lastLogin: "2026-06-15" },
  { username: "myp.coordinator", name: "Zahra Nadia Sholiha, S.Pd.", role: "admin", email: "zahra@school.id", lastLogin: "2026-06-14" },
  { username: "ahmad.fauzi", name: "Ahmad Fauzi, S.Pd.", role: "teacher", email: "ahmad@school.id", lastLogin: "2026-06-15" },
  { username: "siti.nurhaliza", name: "Siti Nurhaliza, M.Pd.", role: "teacher", email: "siti@school.id", lastLogin: "2026-06-10" },
  { username: "alaric.mizan", name: "Alaric Aksara Mizan", role: "student", email: "alaric@student.school.id", lastLogin: "2026-06-12" },
];

const grades = [
  { studentNis: "0112301194", subjectShort: "Bahasa Indonesia", semester: 2, academicYear: "2025/2026", scoreA: 3, scoreB: 3, scoreC: 4, scoreD: 4 },
  { studentNis: "0112301194", subjectShort: "English", semester: 2, academicYear: "2025/2026", scoreA: 6, scoreB: 6, scoreC: 4, scoreD: 4 },
  { studentNis: "0112301194", subjectShort: "Mathematics", semester: 2, academicYear: "2025/2026", scoreA: 6, scoreB: 5, scoreC: 5, scoreD: 5 },
  { studentNis: "0112301194", subjectShort: "Sciences", semester: 2, academicYear: "2025/2026", scoreA: 6, scoreB: 5, scoreC: 6, scoreD: 5 },
  { studentNis: "0112301194", subjectShort: "Ind. & Societies", semester: 2, academicYear: "2025/2026", scoreA: 7, scoreB: 7, scoreC: 7, scoreD: 7 },
  { studentNis: "0112301194", subjectShort: "Arts", semester: 2, academicYear: "2025/2026", scoreA: 4, scoreB: 4, scoreC: 4, scoreD: 4 },
  { studentNis: "0112301194", subjectShort: "PHE", semester: 2, academicYear: "2025/2026", scoreA: 6, scoreB: 5, scoreC: 5, scoreD: 6 },
  { studentNis: "0112301194", subjectShort: "Design", semester: 2, academicYear: "2025/2026", scoreA: 7, scoreB: 5, scoreC: 6, scoreD: 5 },
  { studentNis: "0112301194", subjectShort: "Community Project", semester: 2, academicYear: "2025/2026", scoreA: 7, scoreB: 6, scoreC: 6, scoreD: 7 },
  { studentNis: "0112301195", subjectShort: "Bahasa Indonesia", semester: 2, academicYear: "2025/2026", scoreA: 5, scoreB: 4, scoreC: 5, scoreD: 6 },
  { studentNis: "0112301195", subjectShort: "English", semester: 2, academicYear: "2025/2026", scoreA: 4, scoreB: 5, scoreC: 5, scoreD: 4 },
  { studentNis: "0112301195", subjectShort: "Mathematics", semester: 2, academicYear: "2025/2026", scoreA: 7, scoreB: 6, scoreC: 7, scoreD: 6 },
];

const attendances = [
  { studentNis: "0112301194", semester: 2, academicYear: "2025/2026", present: 42, unexcused: 6, sick: 0, excused: 0 },
  { studentNis: "0112301195", semester: 2, academicYear: "2025/2026", present: 45, unexcused: 2, sick: 1, excused: 0 },
  { studentNis: "0112301196", semester: 2, academicYear: "2025/2026", present: 40, unexcused: 3, sick: 3, excused: 2 },
];

const homeroomComments = [
  {
    studentNis: "0112301194", semester: 2, academicYear: "2025/2026",
    teacherName: "Ahmad Fauzi, S.Pd.",
    comment: "Alhamdulillah, throughout the academic year the student has shown good progress both academically and in character development.",
  },
];

const learnerProfiles = [
  { name: "Inquirers", description: "We nurture our curiosity, developing skills for inquiry and research." },
  { name: "Knowledgeable", description: "We develop and use conceptual understanding, exploring knowledge across a range of disciplines." },
  { name: "Thinkers", description: "We use critical and creative thinking skills to analyse and take responsible action on complex problems." },
  { name: "Communicators", description: "We express ourselves confidently and creatively in more than one language and in many ways." },
  { name: "Principled", description: "We act with integrity and honesty, with a strong sense of fairness and justice." },
  { name: "Open-minded", description: "We critically appreciate our own cultures and personal histories, as well as the values and traditions of others." },
  { name: "Caring", description: "We show empathy, compassion and respect. We have a commitment to service." },
  { name: "Risk-takers", description: "We approach uncertainty with forethought and determination." },
  { name: "Balanced", description: "We understand the importance of balancing different aspects of our lives." },
  { name: "Reflective", description: "We thoughtfully consider the world and our own ideas and experience." },
];

// ─── SEED FUNCTION (SAFE — only inserts if table is empty) ─────────

async function seed() {
  console.log(`🌱 Seeding database... ${forceReset ? '(FORCE RESET)' : '(safe mode)'}\n`);

  if (forceReset) {
    console.log('  ⚠️  Cleaning existing data (--force)...');
    await prisma.teachingAssignment.deleteMany();
    await prisma.criteriaDescriptor.deleteMany();
    await prisma.grade.deleteMany();
    await prisma.attendance.deleteMany();
    await prisma.homeroomComment.deleteMany();
    await prisma.learnerProfile.deleteMany();
    await prisma.appSetting.deleteMany();
    await prisma.alumni.deleteMany();
    await prisma.user.deleteMany();
    await prisma.class.deleteMany();
    await prisma.subject.deleteMany();
    await prisma.teacher.deleteMany();
    await prisma.student.deleteMany();
    await prisma.academicYear.deleteMany();
    await prisma.schoolProfile.deleteMany();
  }

  // ─── Students (skip if any exist) ─────────────────────────────
  const existingStudents = await prisma.student.count();
  if (existingStudents === 0 || forceReset) {
    console.log(`  Creating ${students.length} students...`);
    for (const s of students) await prisma.student.create({ data: s });
  } else {
    console.log(`  Skipping students (${existingStudents} already exist)`);
  }

  // ─── Teachers ─────────────────────────────────────────────────
  const existingTeachers = await prisma.teacher.count();
  if (existingTeachers === 0 || forceReset) {
    console.log(`  Creating ${teachers.length} teachers...`);
    for (const t of teachers) await prisma.teacher.create({ data: t });
  } else {
    console.log(`  Skipping teachers (${existingTeachers} already exist)`);
  }

  // ─── Classes ──────────────────────────────────────────────────
  const existingClasses = await prisma.class.count();
  if (existingClasses === 0 || forceReset) {
    console.log(`  Creating ${classes.length} classes...`);
    for (const c of classes) {
      const homeroomTeacher = teachers.find(t => t.homeroom === c.name);
      const teacherRecord = homeroomTeacher
        ? await prisma.teacher.findUnique({ where: { nip: homeroomTeacher.nip } })
        : null;
      await prisma.class.create({
        data: { ...c, homeroomTeacherId: teacherRecord?.id || null },
      });
    }
  } else {
    console.log(`  Skipping classes (${existingClasses} already exist)`);
  }

  // ─── Subjects ─────────────────────────────────────────────────
  const existingSubjects = await prisma.subject.count();
  if (existingSubjects === 0 || forceReset) {
    console.log(`  Creating ${subjects.length} subjects...`);
    for (const s of subjects) await prisma.subject.create({ data: s });
  } else {
    console.log(`  Skipping subjects (${existingSubjects} already exist)`);
  }

  // ─── Academic Years ───────────────────────────────────────────
  const existingYears = await prisma.academicYear.count();
  if (existingYears === 0 || forceReset) {
    console.log(`  Creating ${academicYears.length} academic years...`);
    for (const ay of academicYears) await prisma.academicYear.create({ data: ay });
  } else {
    console.log(`  Skipping academic years (${existingYears} already exist)`);
  }

  // ─── School Profile ───────────────────────────────────────────
  const existingProfile = await prisma.schoolProfile.findUnique({ where: { id: 1 } });
  if (!existingProfile || forceReset) {
    console.log('  Creating school profile...');
    await prisma.schoolProfile.upsert({
      where: { id: 1 },
      update: schoolProfile,
      create: { id: 1, ...schoolProfile },
    });
  } else {
    console.log('  Skipping school profile (already exists)');
  }

  // ─── Users ────────────────────────────────────────────────────
  const existingUsers = await prisma.user.count();
  if (existingUsers === 0 || forceReset) {
    console.log(`  Creating ${users.length} users...`);
    const DEFAULT_PASS = { admin: 'adminmilbos', teacher: 'gurumilbos', student: 'siswamilbos' };
    for (const u of users) await prisma.user.create({ data: { ...u, password: DEFAULT_PASS[u.role] || 'default', isDefaultPassword: true } });
  } else {
    console.log(`  Skipping users (${existingUsers} already exist)`);
  }

  // ─── Grades ───────────────────────────────────────────────────
  const existingGrades = await prisma.grade.count();
  if (existingGrades === 0 || forceReset) {
    console.log('  Creating grades...');
    const allStudents = await prisma.student.findMany();
    const allSubjects = await prisma.subject.findMany();
    for (const g of grades) {
      const student = allStudents.find(s => s.nis === g.studentNis);
      const subject = allSubjects.find(s => s.shortName === g.subjectShort);
      if (student && subject) {
        await prisma.grade.create({
          data: {
            studentId: student.id, subjectId: subject.id,
            semester: g.semester, academicYear: g.academicYear,
            scoreA: g.scoreA, scoreB: g.scoreB, scoreC: g.scoreC, scoreD: g.scoreD,
          },
        });
      }
    }
  } else {
    console.log(`  Skipping grades (${existingGrades} already exist)`);
  }

  // ─── Attendances ──────────────────────────────────────────────
  const existingAtt = await prisma.attendance.count();
  if (existingAtt === 0 || forceReset) {
    console.log('  Creating attendances...');
    const allStudents = await prisma.student.findMany();
    for (const a of attendances) {
      const student = allStudents.find(s => s.nis === a.studentNis);
      if (student) {
        await prisma.attendance.create({
          data: { studentId: student.id, semester: a.semester, academicYear: a.academicYear, present: a.present, unexcused: a.unexcused, sick: a.sick, excused: a.excused },
        });
      }
    }
  } else {
    console.log(`  Skipping attendances (${existingAtt} already exist)`);
  }

  // ─── Homeroom Comments ────────────────────────────────────────
  const existingComments = await prisma.homeroomComment.count();
  if (existingComments === 0 || forceReset) {
    console.log('  Creating homeroom comments...');
    const allStudents = await prisma.student.findMany();
    for (const hc of homeroomComments) {
      const student = allStudents.find(s => s.nis === hc.studentNis);
      if (student) {
        await prisma.homeroomComment.create({
          data: { studentId: student.id, semester: hc.semester, academicYear: hc.academicYear, teacherName: hc.teacherName, comment: hc.comment },
        });
      }
    }
  } else {
    console.log(`  Skipping homeroom comments (${existingComments} already exist)`);
  }

  // ─── Learner Profiles ─────────────────────────────────────────
  const existingProfiles = await prisma.learnerProfile.count();
  if (existingProfiles === 0 || forceReset) {
    console.log('  Creating learner profiles...');
    for (let i = 0; i < learnerProfiles.length; i++) {
      await prisma.learnerProfile.create({
        data: { order: i + 1, name: learnerProfiles[i].name, description: learnerProfiles[i].description },
      });
    }
  } else {
    console.log(`  Skipping learner profiles (${existingProfiles} already exist)`);
  }

  // ─── Criteria Descriptors ─────────────────────────────────────
  const existingDesc = await prisma.criteriaDescriptor.count();
  if (existingDesc === 0 || forceReset) {
    console.log('  Creating criteria descriptors...');
    const allSubjects = await prisma.subject.findMany();
    const toLevels = (descs) => ({ "0": [], "1-2": [], "3-4": [], "5-6": [], "7-8": descs || [] });
    const defaultDesc = {
      "7": {
        A: { title: "Knowledge and Understanding", levels: toLevels(["demonstrates knowledge and understanding of the subject matter"]) },
        B: { title: "Investigating", levels: toLevels(["investigates and explores ideas and issues"]) },
        C: { title: "Communicating", levels: toLevels(["communicates ideas and information effectively"]) },
        D: { title: "Thinking Critically", levels: toLevels(["thinks critically and creatively about problems"]) },
      },
      "8": {
        A: { title: "Knowledge and Understanding", levels: toLevels(["demonstrates knowledge and understanding of the subject matter"]) },
        B: { title: "Investigating", levels: toLevels(["investigates and explores ideas and issues"]) },
        C: { title: "Communicating", levels: toLevels(["communicates ideas and information effectively"]) },
        D: { title: "Thinking Critically", levels: toLevels(["thinks critically and creatively about problems"]) },
      },
      "9": {
        A: { title: "Knowledge and Understanding", levels: toLevels(["demonstrates in-depth knowledge and understanding of the subject matter"]) },
        B: { title: "Investigating", levels: toLevels(["investigates and explores ideas and issues with depth and insight"]) },
        C: { title: "Communicating", levels: toLevels(["communicates ideas and information with sophistication and precision"]) },
        D: { title: "Thinking Critically", levels: toLevels(["thinks critically and creatively, analysing complex problems"]) },
      },
    };
    const customDesc = {
      "Bahasa Indonesia": {
        "7": { A: { title: "Analysing", levels: toLevels(["identifies and explains the content, context, language, structure, technique and style of texts", "justifies opinions and ideas with examples and explanations"]) }, B: { title: "Organizing", levels: toLevels(["makes use of organizational structures that serve the context and intention", "organizes opinions and ideas with coherence and logic"]) }, C: { title: "Producing text", levels: toLevels(["produces texts that demonstrate personal engagement with the creative process"]) }, D: { title: "Using language", levels: toLevels(["uses a range of appropriate vocabulary, sentence structures and forms of expression", "writes and speaks in a register and style that serve the context and intention"]) } },
        "8": { A: { title: "Analysing", levels: toLevels(["identifies and explains the content, context, language, structure, technique and style of texts", "justifies opinions and ideas with examples and explanations"]) }, B: { title: "Organizing", levels: toLevels(["organizes opinions and ideas with coherence and logic", "uses referencing and formatting tools appropriately"]) }, C: { title: "Producing text", levels: toLevels(["produces texts that demonstrate personal engagement with the creative process"]) }, D: { title: "Using language", levels: toLevels(["uses a range of appropriate vocabulary, sentence structures and forms of expression"]) } },
        "9": { A: { title: "Analysing", levels: toLevels(["provides perceptive identification and explanation of the content, context, language, structure, technique and style", "provides perceptive analysis of the effects of the creator's choices on an audience"]) }, B: { title: "Organizing", levels: toLevels(["makes sophisticated use of organizational structures", "organizes opinions and ideas with a high degree of coherence and logic"]) }, C: { title: "Producing text", levels: toLevels(["produces texts that demonstrate sophisticated personal engagement with the creative process"]) }, D: { title: "Using language", levels: toLevels(["uses a sophisticated range of appropriate vocabulary and forms of expression"]) } },
      },
      "English": {
        "7": { A: { title: "Listening", levels: toLevels(["identifies explicit and some implicit information"]) }, B: { title: "Reading", levels: toLevels(["identifies explicit and some implicit information"]) }, C: { title: "Speaking", levels: toLevels(["communicates with some clarity and coherence"]) }, D: { title: "Writing", levels: toLevels(["writes with some clarity and coherence"]) } },
        "8": { A: { title: "Listening", levels: toLevels(["identifies explicit and some implicit information"]) }, B: { title: "Reading", levels: toLevels(["makes some connections between texts and contexts"]) }, C: { title: "Speaking", levels: toLevels(["uses some range of vocabulary and grammatical structures"]) }, D: { title: "Writing", levels: toLevels(["uses some range of vocabulary and grammatical structures"]) } },
        "9": { A: { title: "Listening", levels: toLevels(["identifies explicit and implicit information in detail"]) }, B: { title: "Reading", levels: toLevels(["analyses explicit and implicit information in depth"]) }, C: { title: "Speaking", levels: toLevels(["communicates with clarity, coherence and sophistication"]) }, D: { title: "Writing", levels: toLevels(["writes with clarity, coherence and sophistication"]) } },
      },
    };
    for (const subject of allSubjects) {
      const desc = customDesc[subject.shortName] || defaultDesc;
      for (const [gradeLevel, criteriaMap] of Object.entries(desc)) {
        for (const [criteria, data] of Object.entries(criteriaMap)) {
          await prisma.criteriaDescriptor.create({
            data: { subjectId: subject.id, gradeLevel, criteria, title: data.title, levels: data.levels || {} },
          });
        }
      }
    }
  } else {
    console.log(`  Skipping criteria descriptors (${existingDesc} already exist)`);
  }

  // ─── Grade Boundaries ────────────────────────────────────────
  const existingBoundaries = await prisma.gradeBoundary.count();
  if (existingBoundaries === 0 || forceReset) {
    if (forceReset) await prisma.gradeBoundary.deleteMany();
    console.log('  Creating grade boundaries...');
    const boundaries = [
      { grade: 1, min: 0, max: 5, label: "Produces work of very limited quality." },
      { grade: 2, min: 6, max: 9, label: "Produces work of limited quality." },
      { grade: 3, min: 10, max: 14, label: "Produces work of an acceptable quality." },
      { grade: 4, min: 15, max: 18, label: "Produces good-quality work." },
      { grade: 5, min: 19, max: 23, label: "Produces generally high-quality work." },
      { grade: 6, min: 24, max: 27, label: "Produces high-quality, occasionally innovative work." },
      { grade: 7, min: 28, max: 32, label: "Produces high-quality, frequently innovative work." },
    ];
    for (const b of boundaries) {
      await prisma.gradeBoundary.create({ data: b });
    }
  } else {
    console.log(`  Skipping grade boundaries (${existingBoundaries} already exist)`);
  }

  console.log('\n✅ Seed completed successfully!');
}

seed()
  .catch(e => { console.error('Seed error:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
