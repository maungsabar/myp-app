// MYP Grade Boundaries
export const gradeBoundaries = [
  { grade: 1, min: 0, max: 5, label: "Produces work of very limited quality." },
  { grade: 2, min: 6, max: 9, label: "Produces work of limited quality." },
  { grade: 3, min: 10, max: 14, label: "Produces work of an acceptable quality." },
  { grade: 4, min: 15, max: 18, label: "Produces good-quality work." },
  { grade: 5, min: 19, max: 23, label: "Produces generally high-quality work." },
  { grade: 6, min: 24, max: 27, label: "Produces high-quality, occasionally innovative work." },
  { grade: 7, min: 28, max: 32, label: "Produces high-quality, frequently innovative work." },
];

export function calculateGrade(totalScore) {
  const b = gradeBoundaries.find(b => totalScore >= b.min && totalScore <= b.max);
  return b ? b.grade : null;
}

export function getLocalGrade(finalGrade) {
  const map = { 1: "E", 2: "D", 3: "C", 4: "B", 5: "B+", 6: "A", 7: "A+" };
  return map[finalGrade] || "-";
}

// All possible criteria letters
export const ALL_CRITERIA = ['A', 'B', 'C', 'D'];

// Get active criteria keys based on criteriaCount (1-4)
export function getCriteriaKeys(count = 4) {
  return ALL_CRITERIA.slice(0, count);
}

// All individual grade levels for criteria configuration
export const CRITERIA_GRADE_LEVELS = [7, 8, 9];

// Resolve criteria count for a specific subject at a specific grade level
export function getCriteriaCount(subject, gradeLevel) {
  if (!subject) return 4;
  // New structure: criteriaConfig keyed by individual grade level
  if (subject.criteriaConfig && gradeLevel != null) {
    const gl = typeof gradeLevel === 'string' ? parseInt(gradeLevel) : gradeLevel;
    if (subject.criteriaConfig[gl] != null) return subject.criteriaConfig[gl];
    return subject.criteriaConfig.default || 4;
  }
  // Legacy fallback: simple criteriaCount number
  if (subject.criteriaCount != null) return subject.criteriaCount;
  return 4;
}

// Calculate MYP grade with auto-scaled boundaries based on number of criteria
export function calculateGradeDynamic(totalScore, numCriteria = 4) {
  if (numCriteria === 4) return calculateGrade(totalScore);
  const maxScore = numCriteria * 8;
  const scale = maxScore / 32;
  const b = gradeBoundaries.find(b =>
    totalScore >= Math.round(b.min * scale) && totalScore <= Math.round(b.max * scale)
  );
  return b ? b.grade : null;
}

// Get grade boundaries scaled to a specific number of criteria
export function getScaledBoundaries(numCriteria = 4) {
  if (numCriteria === 4) return gradeBoundaries;
  const scale = (numCriteria * 8) / 32;
  return gradeBoundaries.map(b => ({
    ...b,
    min: Math.round(b.min * scale),
    max: Math.round(b.max * scale),
  }));
}

// Students
export const students = [
  { id: 1, nis: "0112301194", name: "Alaric Aksara Mizan", class: "8A", gender: "L", birthDate: "2012-03-15", parentEmail: "parent@email.com", status: "active" },
  { id: 2, nis: "0112301195", name: "Aisyah Putri Ramadhani", class: "8A", gender: "P", birthDate: "2012-01-22", parentEmail: "parent@email.com", status: "active" },
  { id: 3, nis: "0112301196", name: "Muhammad Faisal Rahman", class: "8A", gender: "L", birthDate: "2012-05-10", parentEmail: "parent@email.com", status: "active" },
  { id: 4, nis: "0112301197", name: "Zahra Aulia Salsabila", class: "8B", gender: "P", birthDate: "2012-07-08", parentEmail: "parent@email.com", status: "active" },
  { id: 5, nis: "0112301198", name: "Ahmad Dzulfiqar Pratama", class: "8B", gender: "L", birthDate: "2012-11-30", parentEmail: "parent@email.com", status: "active" },
  { id: 6, nis: "0112301199", name: "Khadijah Nur Azizah", class: "8B", gender: "P", birthDate: "2012-04-18", parentEmail: "parent@email.com", status: "active" },
  { id: 7, nis: "0112301200", name: "Umar Hadi Saputra", class: "9A", gender: "L", birthDate: "2011-09-25", parentEmail: "parent@email.com", status: "active" },
  { id: 8, nis: "0112301201", name: "Fatimah Zahra Maharani", class: "9A", gender: "P", birthDate: "2011-12-14", parentEmail: "parent@email.com", status: "active" },
];

// Teachers
export const teachers = [
  { id: 1, nip: "198501012010011001", name: "Fadhli Darmawan, S.Pd.", role: "admin", subject: null, homeroom: null, email: "fadhli@school.id" },
  { id: 2, nip: "199002152015032001", name: "Zahra Nadia Sholiha, S.Pd.", role: "admin", subject: null, homeroom: null, email: "zahra@school.id" },
  { id: 3, nip: "198805102012011002", name: "Ahmad Fauzi, S.Pd.", role: "homeroom", subject: "Mathematics", homeroom: "8A", email: "ahmad@school.id" },
  { id: 4, nip: "199203202016012001", name: "Siti Nurhaliza, M.Pd.", role: "subject", subject: "Language and Literature: Bahasa Indonesia", homeroom: null, email: "siti@school.id" },
  { id: 5, nip: "198712152011011003", name: "David Thompson, M.Ed.", role: "subject", subject: "Language Acquisition: English", homeroom: null, email: "david@school.id" },
  { id: 6, nip: "199108252015012002", name: "Dewi Kartika, S.Si.", role: "subject", subject: "Sciences", homeroom: null, email: "dewi@school.id" },
  { id: 7, nip: "198604182010012003", name: "Rina Wulandari, S.Pd.", role: "homeroom", subject: "Individuals and Societies", homeroom: "8B", email: "rina@school.id" },
  { id: 8, nip: "199306122017011001", name: "Bagus Prasetyo, S.Sn.", role: "subject", subject: "Arts: Visual/Performing", homeroom: null, email: "bagus@school.id" },
];

// Classes
export const classes = [
  { id: 1, name: "7A", level: 7, suffix: "A", homeroomTeacherId: null, capacity: 30 },
  { id: 2, name: "7B", level: 7, suffix: "B", homeroomTeacherId: null, capacity: 30 },
  { id: 3, name: "8A", level: 8, suffix: "A", homeroomTeacherId: 3, capacity: 30 },
  { id: 4, name: "8B", level: 8, suffix: "B", homeroomTeacherId: 7, capacity: 30 },
  { id: 5, name: "9A", level: 9, suffix: "A", homeroomTeacherId: null, capacity: 30 },
  { id: 6, name: "9B", level: 9, suffix: "B", homeroomTeacherId: null, capacity: 30 },
];

// Subjects
export const subjects = [
  { id: 1, name: "Language and Literature: Bahasa Indonesia", category: "Language and Literature", shortName: "Bahasa Indonesia" },
  { id: 2, name: "Language Acquisition: English Level 1/2/3/4", category: "Language Acquisition", shortName: "English" },
  { id: 3, name: "Mathematics", category: "Mathematics", shortName: "Mathematics" },
  { id: 4, name: "Sciences", category: "Sciences", shortName: "Sciences" },
  { id: 5, name: "Individuals and Societies", category: "Individuals and Societies", shortName: "Ind. & Societies" },
  { id: 6, name: "Arts: Visual/Performing", category: "Arts", shortName: "Arts" },
  { id: 7, name: "Physical and Health Education", category: "Physical and Health Education", shortName: "PHE", criteriaConfig: { default: 4, 7: 3 } },
  { id: 8, name: "Design", category: "Design", shortName: "Design" },
  { id: 9, name: "Community Project", category: "Community Project", shortName: "Community Project", availableGrades: [9], criteriaConfig: { default: 4 } },
  { id: 10, name: "Interdisciplinary Learning (Math+Design)", category: "Mathematics", shortName: "Interdisciplinary", availableGrades: [7], criteriaConfig: { default: 3 } },
];

// Grade levels for descriptor grouping (individual grades)
export const GRADE_LEVELS = [
  { key: "7", label: "Grade 7", description: "MYP Year 2–3" },
  { key: "8", label: "Grade 8", description: "MYP Year 2–3" },
  { key: "9", label: "Grade 9", description: "MYP Year 4" },
];

// MYP Achievement level bands for descriptors
export const ACHIEVEMENT_LEVELS = [
  { key: "0", label: "0", description: "The student does not reach a standard described by any of the descriptors below." },
  { key: "1-2", label: "1–2", description: "The student is able to:" },
  { key: "3-4", label: "3–4", description: "The student is able to:" },
  { key: "5-6", label: "5–6", description: "The student is able to:" },
  { key: "7-8", label: "7–8", description: "The student is able to:" },
];

// Helper: get grade level key from class name (e.g. "8A" → "8", "9B" → "9")
export function getGradeLevelKey(className) {
  return String(parseInt(className));
}

// Helper: get display label for a semester number from an academic year object
export function getSemesterLabel(academicYear, semesterNumber) {
  if (!academicYear) return `Semester ${semesterNumber}`;
  if (semesterNumber === 1) return academicYear.semester1Name || 'Semester 1';
  if (semesterNumber === 2) return academicYear.semester2Name || 'Semester 2';
  return `Semester ${semesterNumber}`;
}

// Criteria descriptors per subject per individual grade
const bhsIndo78 = {
  A: { title: "Analysing", descriptors: [
    "identifies and explains the content, context, language, structure, technique and style of texts",
    "identifies and explains the effects of the creator's choices on an audience",
    "justifies opinions and ideas with examples and explanations",
    "identifies similarities and differences in features within and between genres and texts"
  ]},
  B: { title: "Organizing", descriptors: [
    "makes use of organizational structures that serve the context and intention",
    "organizes opinions and ideas with coherence and logic",
    "uses referencing and formatting tools appropriately"
  ]},
  C: { title: "Producing text", descriptors: [
    "produces texts that demonstrate personal engagement with the creative process",
    "makes stylistic choices in terms of linguistic, literary and visual devices",
    "selects relevant details and examples to develop ideas"
  ]},
  D: { title: "Using language", descriptors: [
    "uses a range of appropriate vocabulary, sentence structures and forms of expression",
    "writes and speaks in a register and style that serve the context and intention",
    "uses grammar, syntax and punctuation with a degree of accuracy",
    "spells/writes and pronounces with a degree of accuracy",
    "uses appropriate non-verbal communication techniques"
  ]},
};
const bhsIndo9 = {
  A: { title: "Analysing", descriptors: [
    "provides perceptive identification and explanation of the content, context, language, structure, technique and style",
    "provides perceptive analysis of the effects of the creator's choices on an audience",
    "evaluates and justifies opinions and ideas with detailed examples and explanations",
    "analyses similarities and differences in features within and between genres and texts"
  ]},
  B: { title: "Organizing", descriptors: [
    "makes sophisticated use of organizational structures that serve the context and intention",
    "organizes opinions and ideas with a high degree of coherence and logic",
    "makes sophisticated use of referencing and formatting tools"
  ]},
  C: { title: "Producing text", descriptors: [
    "produces texts that demonstrate sophisticated personal engagement with the creative process",
    "makes sophisticated stylistic choices in terms of linguistic, literary and visual devices",
    "selects extensive relevant details and examples to develop ideas"
  ]},
  D: { title: "Using language", descriptors: [
    "uses a sophisticated range of appropriate vocabulary, sentence structures and forms of expression",
    "writes and speaks in a register and style that serve the context and intention effectively",
    "uses grammar, syntax and punctuation with a high degree of accuracy",
    "spells/writes and pronounces with a high degree of accuracy",
    "makes sophisticated use of appropriate non-verbal communication techniques"
  ]},
};
const english78 = {
  A: { title: "Listening", descriptors: ["identifies explicit and some implicit information", "identifies some conventions and attitudes"] },
  B: { title: "Reading", descriptors: ["identifies explicit and some implicit information", "makes some connections between texts and contexts"] },
  C: { title: "Speaking", descriptors: ["communicates with some clarity and coherence", "uses some range of vocabulary and grammatical structures"] },
  D: { title: "Writing", descriptors: ["writes with some clarity and coherence", "uses some range of vocabulary and grammatical structures"] },
};
const english9 = {
  A: { title: "Listening", descriptors: ["identifies explicit and implicit information in detail", "analyses conventions and attitudes with supporting evidence"] },
  B: { title: "Reading", descriptors: ["analyses explicit and implicit information in depth", "makes detailed connections between texts and contexts"] },
  C: { title: "Speaking", descriptors: ["communicates with clarity, coherence and sophistication", "uses a wide range of vocabulary and complex grammatical structures"] },
  D: { title: "Writing", descriptors: ["writes with clarity, coherence and sophistication", "uses a wide range of vocabulary and complex grammatical structures"] },
};

export const criteriaDescriptors = {
  1: { "7": { ...bhsIndo78 }, "8": { ...bhsIndo78 }, "9": { ...bhsIndo9 } },
  2: { "7": { ...english78 }, "8": { ...english78 }, "9": { ...english9 } },
};

// Fill default descriptors for subjects without custom ones
const defaultDescriptors = {
  "7": {
    A: { title: "Knowledge and Understanding", descriptors: ["demonstrates knowledge and understanding of the subject matter"] },
    B: { title: "Investigating", descriptors: ["investigates and explores ideas and issues"] },
    C: { title: "Communicating", descriptors: ["communicates ideas and information effectively"] },
    D: { title: "Thinking Critically", descriptors: ["thinks critically and creatively about problems"] },
  },
  "8": {
    A: { title: "Knowledge and Understanding", descriptors: ["demonstrates knowledge and understanding of the subject matter"] },
    B: { title: "Investigating", descriptors: ["investigates and explores ideas and issues"] },
    C: { title: "Communicating", descriptors: ["communicates ideas and information effectively"] },
    D: { title: "Thinking Critically", descriptors: ["thinks critically and creatively about problems"] },
  },
  "9": {
    A: { title: "Knowledge and Understanding", descriptors: ["demonstrates in-depth knowledge and understanding of the subject matter"] },
    B: { title: "Investigating", descriptors: ["investigates and explores ideas and issues with depth and insight"] },
    C: { title: "Communicating", descriptors: ["communicates ideas and information with sophistication and precision"] },
    D: { title: "Thinking Critically", descriptors: ["thinks critically and creatively, analysing complex problems"] },
  },
};

subjects.forEach(s => {
  if (!criteriaDescriptors[s.id]) {
    criteriaDescriptors[s.id] = {
      "7": { ...defaultDescriptors["7"] },
      "8": { ...defaultDescriptors["8"] },
      "9": { ...defaultDescriptors["9"] },
    };
  }
});

// Grades (scores for student per subject per semester)
export const grades = [
  { id: 1, studentId: 1, subjectId: 1, semester: 2, academicYear: "2025/2026", scoreA: 3, scoreB: 3, scoreC: 4, scoreD: 4 },
  { id: 2, studentId: 1, subjectId: 2, semester: 2, academicYear: "2025/2026", scoreA: 6, scoreB: 6, scoreC: 4, scoreD: 4 },
  { id: 3, studentId: 1, subjectId: 3, semester: 2, academicYear: "2025/2026", scoreA: 6, scoreB: 5, scoreC: 5, scoreD: 5 },
  { id: 4, studentId: 1, subjectId: 4, semester: 2, academicYear: "2025/2026", scoreA: 6, scoreB: 5, scoreC: 6, scoreD: 5 },
  { id: 5, studentId: 1, subjectId: 5, semester: 2, academicYear: "2025/2026", scoreA: 7, scoreB: 7, scoreC: 7, scoreD: 7 },
  { id: 6, studentId: 1, subjectId: 6, semester: 2, academicYear: "2025/2026", scoreA: 4, scoreB: 4, scoreC: 4, scoreD: 4 },
  { id: 7, studentId: 1, subjectId: 7, semester: 2, academicYear: "2025/2026", scoreA: 6, scoreB: 5, scoreC: 5, scoreD: 6 },
  { id: 8, studentId: 1, subjectId: 8, semester: 2, academicYear: "2025/2026", scoreA: 7, scoreB: 5, scoreC: 6, scoreD: 5 },
  { id: 9, studentId: 1, subjectId: 9, semester: 2, academicYear: "2025/2026", scoreA: 7, scoreB: 6, scoreC: 6, scoreD: 7 },
  // Student 2
  { id: 10, studentId: 2, subjectId: 1, semester: 2, academicYear: "2025/2026", scoreA: 5, scoreB: 4, scoreC: 5, scoreD: 6 },
  { id: 11, studentId: 2, subjectId: 2, semester: 2, academicYear: "2025/2026", scoreA: 4, scoreB: 5, scoreC: 5, scoreD: 4 },
  { id: 12, studentId: 2, subjectId: 3, semester: 2, academicYear: "2025/2026", scoreA: 7, scoreB: 6, scoreC: 7, scoreD: 6 },
];

// Attendance
export const attendances = [
  { id: 1, studentId: 1, semester: 2, academicYear: "2025/2026", present: 42, unexcused: 6, sick: 0, excused: 0 },
  { id: 2, studentId: 2, semester: 2, academicYear: "2025/2026", present: 45, unexcused: 2, sick: 1, excused: 0 },
  { id: 3, studentId: 3, semester: 2, academicYear: "2025/2026", present: 40, unexcused: 3, sick: 3, excused: 2 },
];

// Homeroom comments
export const homeroomComments = [
  {
    id: 1, studentId: 1, semester: 2, academicYear: "2025/2026",
    teacherName: "Ahmad Fauzi, S.Pd.",
    comment: "Alhamdulillah, throughout the academic year the student has shown good progress both academically and in character development. The student demonstrates curiosity in learning (Inquirer), communicates politely (Communicator), and shows honesty and responsibility (Principled). May the student continue to strengthen enthusiasm for learning, broaden knowledge, and maintain noble character, becoming a knowledgeable, faithful, and beneficial individual for others."
  },
];

// Academic years
export const academicYears = [
  { id: 1, year: "2024/2025", semesters: [1, 2], activeSemester: 2 },
  { id: 2, year: "2025/2026", semesters: [1, 2], activeSemester: 2, isActive: true },
];

// School profile
export const schoolProfile = {
  name: "MTs MILBoS",
  address: "Jl. Pendidikan No. 1, Jakarta Selatan",
  phone: "+62 21 1234 5678",
  email: "info@ibschool.sch.id",
  principal: "Fadhli Darmawan, S.Pd.",
  mypCoordinator: "Zahra Nadia Sholiha, S.Pd.",
  academicYear: "2025/2026",
  semester: 2,
};

// Alumni
export const alumni = [
  { id: 1, nis: "0112201100", name: "Hasan Abdullah", class: "9A", graduationYear: "2024/2025", nextSchool: "SMA Negeri 1 Jakarta" },
  { id: 2, nis: "0112201101", name: "Maryam Siti Aisyah", class: "9B", graduationYear: "2024/2025", nextSchool: "MAN 2 Jakarta" },
];

// Users (for user management)
export const users = [
  { id: 1, username: "admin", name: "Fadhli Darmawan, S.Pd.", role: "admin", email: "fadhli@school.id", lastLogin: "2026-06-15" },
  { id: 2, username: "myp.coordinator", name: "Zahra Nadia Sholiha, S.Pd.", role: "admin", email: "zahra@school.id", lastLogin: "2026-06-14" },
  { id: 3, username: "ahmad.fauzi", name: "Ahmad Fauzi, S.Pd.", role: "teacher", email: "ahmad@school.id", lastLogin: "2026-06-15" },
  { id: 4, username: "siti.nurhaliza", name: "Siti Nurhaliza, M.Pd.", role: "teacher", email: "siti@school.id", lastLogin: "2026-06-10" },
  { id: 5, username: "alaric.mizan", name: "Alaric Aksara Mizan", role: "student", email: "alaric@student.school.id", lastLogin: "2026-06-12" },
];

// IB Learner Profile
export const learnerProfiles = [
  { name: "Inquirers", description: "We nurture our curiosity, developing skills for inquiry and research. We know how to learn independently and with others. We learn with enthusiasm and sustain our love of learning throughout life." },
  { name: "Knowledgeable", description: "We develop and use conceptual understanding, exploring knowledge across a range of disciplines. We engage with issues and ideas that have local and global significance." },
  { name: "Thinkers", description: "We use critical and creative thinking skills to analyse and take responsible action on complex problems. We exercise initiative in making reasoned, ethical decisions." },
  { name: "Communicators", description: "We express ourselves confidently and creatively in more than one language and in many ways. We collaborate effectively, listening carefully to the perspectives of other individuals and groups." },
  { name: "Principled", description: "We act with integrity and honesty, with a strong sense of fairness and justice, and with respect for the dignity and rights of people everywhere. We take responsibility for our actions and their consequences." },
  { name: "Open-minded", description: "We critically appreciate our own cultures and personal histories, as well as the values and traditions of others. We seek and evaluate a range of points of view, and we are willing to grow from the experience." },
  { name: "Caring", description: "We show empathy, compassion and respect. We have a commitment to service, and we act to make a positive difference in the lives of others and in the world around us." },
  { name: "Risk-takers", description: "We approach uncertainty with forethought and determination; we work independently and cooperatively to explore new ideas and innovative strategies." },
  { name: "Balanced", description: "We understand the importance of balancing different aspects of our lives—intellectual, physical, and emotional—to achieve well-being for ourselves and others." },
  { name: "Reflective", description: "We thoughtfully consider the world and our own ideas and experience. We work to understand our strengths and weaknesses in order to support our learning and personal development." },
];

// IB Learner Profile logo (base64 data URL or null)
export const ibProfileLogo = null;
