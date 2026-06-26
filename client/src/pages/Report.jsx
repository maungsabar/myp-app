import { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import api from '../services/api';
import { getCriteriaKeys, getCriteriaCount } from '../data/dummyData';
import { FileText, Printer, ChevronDown, User, BookOpen, Award, GraduationCap, Download } from 'lucide-react';
import ReportPreviewModal from '../components/shared/ReportPreviewModal';

/* ── helpers ─────────────────────────────────────────────────────── */

function getGradeBadgeClasses(grade) {
  if (!grade) return 'bg-gray-100 text-gray-500';
  if (grade <= 2) return 'bg-red-100 text-red-700';
  if (grade === 3) return 'bg-orange-100 text-orange-700';
  if (grade === 4) return 'bg-yellow-100 text-yellow-800';
  if (grade === 5) return 'bg-amber-100 text-amber-700';
  if (grade === 6) return 'bg-emerald-100 text-emerald-700';
  return 'bg-teal-100 text-teal-800';
}

function getGradeBorderColor(grade) {
  if (!grade) return 'border-gray-300';
  if (grade <= 2) return 'border-red-400';
  if (grade === 3) return 'border-orange-400';
  if (grade === 4) return 'border-yellow-500';
  if (grade === 5) return 'border-amber-400';
  if (grade === 6) return 'border-emerald-400';
  return 'border-teal-400';
}

/* ── Page wrapper (A4 feel) ──────────────────────────────────────── */

function ReportPage({ pageNum, totalPages, studentName, nis, studentClass, semester, academicYear, children }) {
  const { activeYear, getSemesterLabel } = useApp();
  const semesterLabel = getSemesterLabel(activeYear, semester);
  const now = new Date();
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const printDate = `${monthNames[now.getMonth()]} ${now.getFullYear()}`;

  return (
    <div className="relative bg-white shadow-lg border border-gray-200 rounded-sm mx-auto mb-8"
      style={{ width: '210mm', minHeight: '297mm', padding: '20mm 18mm 22mm 18mm' }}
    >
      <div className="text-gray-800 leading-relaxed" style={{ fontFamily: "'Montserrat', sans-serif" }}>
        {children}
      </div>
      {/* Footer */}
      <div className="absolute bottom-5 left-0 right-0 px-[18mm] flex items-end justify-between text-[9px] text-gray-400 border-t border-gray-200 pt-2">
        {/* Left: Student info */}
        <div className="flex flex-col gap-0.5">
          <span className="font-semibold text-gray-500">
            {nis || ''} — {studentName || ''}{studentClass ? ` — ${studentClass}` : ''}
          </span>
          <span>{semesterLabel || `Semester ${semester}`}, report - {academicYear}</span>
        </div>
        {/* Right: Date + Page */}
        <div className="flex flex-col items-end gap-0.5">
          <span>{printDate}</span>
          <span className="font-semibold text-gray-500">Page {pageNum} of {totalPages}</span>
        </div>
      </div>
    </div>
  );
}

/* ── PAGE 1 : Cover Letter ───────────────────────────────────────── */

function CoverPage({ schoolProfile, student, semester, academicYear, pageNum, totalPages }) {
  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <ReportPage pageNum={pageNum} totalPages={totalPages} studentName={student.name} nis={student.nis} studentClass={student.class} semester={semester} academicYear={academicYear}>
      {/* Letter body */}
      <div className="text-sm leading-7 text-gray-700 mb-10 space-y-4 text-justify">
        <p>Dear Parents,</p>
        <p>Assalamu’alaikum warahmatullahi wabarakatuh,</p>
        <p>
          Alhamdulillah, with gratitude to Allah ﷻ, we are pleased to share with you the MYP Semester Report for the academic year {academicYear} This report is designed to provide you with a clear picture of your child’s learning progress across all subject groups within the Middle Years Programme (MYP).
        </p>
        <p>
          Our aim is to help you, together with your child and their teachers, reflect on learning achievements and plan meaningful steps for continuous academic, personal, and spiritual growth in line with our vision of nurturing future Islamic leaders who embody the values of faith, knowledge, and good character (iman, ilmu, dan akhlak).
        </p>
        <p>
          In the MYP, your child’s progress is assessed through criteria (up to A, B, C, D depending on the subject) for each subject. Each criterion is scored out of 8 points, and the total is converted to a final grade (1–7) according to MYP grade boundaries that are scaled to the number of criteria assessed.
        </p>
        <p>
          At this stage of the academic year, some subjects may have assessed all four criteria, while others may have assessed fewer. Therefore, if a subject has not yet covered all four criteria, a final grade may not be awarded this semester.
        </p>
        <p>
          You will also find teacher reflections on how your child has demonstrated the IB Learner Profile attributes, integrated with the values of Islam that guide our school culture. Details about grade boundaries and learner profiles are included at the end of this report.
        </p>
        <p>
          We encourage you to use this report as a chance to celebrate progress and discuss areas for further improvement with your child. Should you wish to have a deeper conversation about your child’s development, you are warmly invited to make an appointment with the respective subject or homeroom teachers.
        </p>
        <p>
          Thank you for your continuous support and partnership in your child’s educational journey.
        </p>
      </div>
      <div className="text-sm leading-7 text-gray-700 space-y-4">
        <p>Wassalamu’alaikum warahmatullahi wabarakatuh,</p>
        <p>Kind regards,</p>
      </div>

      {/* Signatures */}
      <div className="flex justify-between mt-12">
        <div className="text-center w-48">
          <div className="border-b border-gray-400 mb-1 h-16"></div>
          <p className="text-sm font-bold">{schoolProfile.principal}</p>
          <p className="text-xs text-gray-500">Principal</p>
        </div>
        <div className="text-center w-48">
          <div className="border-b border-gray-400 mb-1 h-16"></div>
          <p className="text-sm font-bold">{schoolProfile.mypCoordinator}</p>
          <p className="text-xs text-gray-500">MYP Coordinator</p>
        </div>
      </div>

    </ReportPage>
  );
}

/* ── PAGE 2 : Guidelines ─────────────────────────────────────────── */

function GuidelinesPage({ gradeBoundaries, studentName, nis, studentClass, semester, academicYear, pageNum, totalPages }) {
  return (
    <ReportPage pageNum={pageNum} totalPages={totalPages} studentName={studentName} nis={nis} studentClass={studentClass} semester={semester} academicYear={academicYear}>
      <h2 className="text-lg font-bold text-primary-800 mb-6 border-b border-primary-200 pb-2">
        Assessment Criterias
      </h2>

      {/* Grade boundaries table */}
      <h3 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wider">
        MYP Assessment Criterias
      </h3>
      <table className="w-full text-sm border-collapse mb-8">
        <thead>
          <tr className="bg-primary-700 text-white">
            <th className="px-3 py-2 text-left border border-primary-800">Final Grade</th>
            <th className="px-3 py-2 text-center border border-primary-800">Boundary Guidelines</th>
            <th className="px-3 py-2 text-left border border-primary-800">Descriptor</th>
          </tr>
        </thead>
        <tbody>
          {gradeBoundaries.map(b => (
            <tr key={b.grade} className="even:bg-gray-50">
              <td className="px-3 py-2 border border-gray-200 font-bold text-center">
                <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${getGradeBadgeClasses(b.grade)}`}>
                  {b.grade}
                </span>
              </td>
              <td className="px-3 py-2 border border-gray-200 text-center font-medium">{b.min} &ndash; {b.max}</td>
              <td className="px-3 py-2 border border-gray-200 text-gray-600 italic text-justify">{b.label}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </ReportPage>
  );
}

/* ── PAGE 3 : Progress Summary ───────────────────────────────────── */

function ProgressSummaryPage({ student, subjectGrades, attendance, homeroomComment, semester, academicYear, calculateGradeDynamic, getLocalGrade, pageNum, totalPages }) {
  const allCriteria = ['A', 'B', 'C', 'D'];
  return (
    <ReportPage pageNum={pageNum} totalPages={totalPages} studentName={student.name} nis={student.nis} studentClass={student.class} semester={semester} academicYear={academicYear}>
      <h2 className="text-lg font-bold text-primary-800 mb-6 border-b border-primary-200 pb-2">
        Progress Summary
      </h2>

      {/* Student info */}
       <h3 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wider">
        Progress summary for subjects
      </h3>

      {/* Subject grades table */}
      <table className="w-full text-xs border-collapse mb-6">
        <thead>
          <tr className="bg-primary-700 text-white">
            <th className="px-2 py-2 text-left border border-primary-800 w-8">No</th>
            <th className="px-2 py-2 text-left border border-primary-800">Subject</th>
            {allCriteria.map(c => (
              <th key={c} className="px-2 py-2 text-center border border-primary-800 w-10">{c}</th>
            ))}
            <th className="px-2 py-2 text-center border border-primary-800 w-14">Total</th>
            <th className="px-2 py-2 text-center border border-primary-800 w-16">MYP Grade</th>
            <th className="px-2 py-2 text-center border border-primary-800 w-14">Local</th>
          </tr>
        </thead>
        <tbody>
          {subjectGrades.map((sg, idx) => {
            const cc = sg.criteriaCount || 4;
            const activeKeys = getCriteriaKeys(cc);
            const total = activeKeys.reduce((sum, k) => sum + (sg[`score${k}`] || 0), 0);
            const maxTotal = cc * 8;
            const fg = calculateGradeDynamic(total, cc);
            return (
              <tr key={sg.subjectId} className="even:bg-gray-50">
                <td className="px-2 py-1.5 border border-gray-200 text-center">{idx + 1}</td>
                <td className="px-2 py-1.5 border border-gray-200 font-medium">{sg.shortName}</td>
                {allCriteria.map(c => (
                  <td key={c} className="px-2 py-1.5 border border-gray-200 text-center">
                    {activeKeys.includes(c) ? sg[`score${c}`] : <span className="text-gray-300">—</span>}
                  </td>
                ))}
                <td className="px-2 py-1.5 border border-gray-200 text-center font-bold">{total}<span className="text-[9px] text-gray-400 font-normal">/{maxTotal}</span></td>
                <td className="px-2 py-1.5 border border-gray-200 text-center">
                  <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${getGradeBadgeClasses(fg)}`}>
                    {fg}
                  </span>
                </td>
                <td className="px-2 py-1.5 border border-gray-200 text-center font-medium">{getLocalGrade(fg)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Homeroom Teacher Comment */}
      <div className="mb-6">
        <h3 className="text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">
          Homeroom Teacher Comment
        </h3>
        <div className="border border-gray-200 rounded p-4 bg-gray-50 min-h-[80px]">
          {homeroomComment ? (
            <>
              <p className="text-sm text-gray-700 leading-6 italic">{homeroomComment.comment}</p>
              <p className="text-xs text-gray-400 mt-2 text-right">&mdash; {homeroomComment.teacherName}</p>
            </>
          ) : (
            <p className="text-sm text-gray-400 italic">No comment recorded for this semester.</p>
          )}
        </div>
      </div>

      {/* Attendance table */}
      <div>
        <h3 className="text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">
          Attendance Record
        </h3>
        {attendance ? (
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-3 py-2 text-center border border-gray-200">Present </th>
                <th className="px-3 py-2 text-center border border-gray-200">Unexcused </th>
                <th className="px-3 py-2 text-center border border-gray-200">Sick </th>
                <th className="px-3 py-2 text-center border border-gray-200">Excused </th>
                <th className="px-3 py-2 text-center border border-gray-200">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="px-3 py-2 text-center border border-gray-200 font-bold text-emerald-700">{attendance.present}</td>
                <td className="px-3 py-2 text-center border border-gray-200 font-bold text-red-600">{attendance.unexcused}</td>
                <td className="px-3 py-2 text-center border border-gray-200 font-bold text-amber-600">{attendance.sick}</td>
                <td className="px-3 py-2 text-center border border-gray-200 font-bold text-blue-600">{attendance.excused}</td>
                <td className="px-3 py-2 text-center border border-gray-200 font-bold">{attendance.present + attendance.unexcused + attendance.sick + attendance.excused}</td>
              </tr>
            </tbody>
          </table>
        ) : (
          <p className="text-sm text-gray-400 italic">No attendance data recorded.</p>
        )}
      </div>
    </ReportPage>
  );
}

/* ── PAGE 4+ : Subject Detail ────────────────────────────────────── */

// Map a score (0-8) to its achievement level band key
function getScoreLevel(score) {
  if (score === 0) return "0";
  if (score <= 2) return "1-2";
  if (score <= 4) return "3-4";
  if (score <= 6) return "5-6";
  return "7-8";
}

function SubjectDetailPage({ subject, grade, criteriaDescriptors, gradeLevel, studentName, nis, studentClass, semester, academicYear, calculateGradeDynamic, getLocalGrade, getScaledBoundaries, pageNum, totalPages }) {
  const cc = getCriteriaCount(subject, studentClass ? parseInt(studentClass) : null);
  const criteriaList = getCriteriaKeys(cc);
  const maxScore = cc * 8;
  const scaledBoundaries = getScaledBoundaries(cc);

  const subjectDescriptors = criteriaDescriptors?.[subject.id];
  const descriptors = subjectDescriptors?.[gradeLevel] || subjectDescriptors?.['7'] || {};

  const scores = {};
  let total = 0;
  criteriaList.forEach(c => {
    const s = grade?.[`score${c}`] ?? 0;
    scores[c] = s;
    total += s;
  });

  const finalGrade = calculateGradeDynamic(total, cc);
  const localGrade = getLocalGrade(finalGrade);

  return (
    <ReportPage pageNum={pageNum} totalPages={totalPages} studentName={studentName} nis={nis} studentClass={studentClass} semester={semester} academicYear={academicYear}>
      {/* Subject header */}
      
        <div className="border-b-2 border-primary-700 pb-3 mb-6">
          <h2 className="text-lg font-bold text-primary-800">{subject.name}</h2>
          <p className="text-xs text-gray-500 mt-0.5">MYP Assessment Criterion</p>
        </div>

      {/* Criteria sections */}
      {criteriaList.map(c => {
        const desc = descriptors[c] || { title: c, levels: {} };
        const score = scores[c];
        const levelKey = getScoreLevel(score);
        // Get descriptors for the matching level band, fallback to old flat descriptors
        const levelDescs = desc.levels?.[levelKey] || desc.descriptors || [];
        return (
          <div key={c} className="mb-5">
            <div className="flex items-center justify-between mb-1.5">
              <h3 className="text-sm font-bold text-gray-700">
                Criterion {c}: {desc.title}
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">Achievement</span>
                <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-sm font-bold border-2 ${
                  score >= 6 ? 'border-emerald-300 bg-emerald-50 text-emerald-700' :
                  score >= 4 ? 'border-amber-300 bg-amber-50 text-amber-700' :
                  'border-red-200 bg-red-50 text-red-600'
                }`}>
                  {score}
                </span>
                <span className="text-xs text-gray-400">/ 8</span>
              </div>
            </div>
            {/* Score bar */}
            <div className="h-1.5 bg-gray-100 rounded-full mb-1 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  score >= 6 ? 'bg-emerald-500' : score >= 4 ? 'bg-amber-400' : 'bg-red-400'
                }`}
                style={{ width: `${(score / 8) * 100}%` }}
              />
            </div>
            <p className="text-[10px] text-gray-400 mb-1.5">Level {levelKey}</p>
            {levelDescs.length > 0 && (() => {
              // Separate heading prefix (e.g. "The student is able to:") from achievement items
              const firstItem = levelDescs[0];
              const isHeading = typeof firstItem === 'string' && firstItem.trim().endsWith(':');
              const heading = isHeading ? firstItem : null;
              const items = isHeading ? levelDescs.slice(1) : levelDescs;
              return (
                <div className="text-xs text-gray-500 leading-5 space-y-0.5">
                  {heading && <p className="font-medium text-gray-600">{heading}</p>}
                  {items.length > 0 && (
                    <ul className="list-disc list-inside space-y-0.5">
                      {items.map((d, i) => (
                        <li key={i}>{d}</li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })()}
          </div>
        );
      })}

      {/* Total & Grade rekap */}
      <div className="mt-8 border-t-2 border-primary-200 pt-5">
        <div className="flex items-center justify-between">
          {/* Grade boxes on the left */}
          <div className="flex gap-2.5">
            {/* MYP Grade box - colored per boundary */}
            <div className={`rounded-md border-2 ${getGradeBorderColor(finalGrade)} px-3 py-2 text-center w-24 ${getGradeBadgeClasses(finalGrade)}`}>
              <p className="text-[9px] font-semibold uppercase tracking-wider opacity-70 mb-0.5">MYP Grade</p>
              <p className="text-xl font-bold">{finalGrade}</p>
            </div>
            {/* Local Grade box */}
            <div className="bg-warm-50 border border-warm-200 rounded-md px-3 py-2 text-center w-24">
              <p className="text-[9px] font-semibold text-gray-500 uppercase tracking-wider mb-0.5">Local Grade</p>
              <p className="text-xl font-bold text-primary-800">{localGrade}</p>
            </div>
          </div>
          {/* Total score on the right */}
          <div className="text-right">
            <p className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-0.5">Total Score</p>
            <p className="text-2xl font-bold text-primary-800">{total} <span className="text-xs text-gray-400 font-normal">/ {maxScore}</span></p>
          </div>
        </div>
      </div>

      {/* Boundary reference mini-table */}
      <div className="mt-5">
        <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-1.5">Grade Boundary Reference</p>
        <div className="flex gap-1.5">
          {scaledBoundaries.map(b => (
            <div
              key={b.grade}
              className={`flex-1 text-center py-1 rounded text-[10px] font-medium border ${
                b.grade === finalGrade
                  ? getGradeBadgeClasses(b.grade) + ' ' + getGradeBorderColor(b.grade) + ' ring-2 ring-offset-1 ring-primary-300'
                  : 'bg-gray-50 text-gray-400 border-gray-200'
              }`}
            >
              <div className="font-bold">{b.grade}</div>
              <div>{b.min}-{b.max}</div>
            </div>
          ))}
        </div>
      </div>
    </ReportPage>
  );
}

/* ── LAST PAGE : IB Learner Profile ──────────────────────────────── */

function LearnerProfilePage({ learnerProfiles, logo, studentName, nis, studentClass, semester, academicYear, pageNum, totalPages, schoolName }) {
  return (
    <ReportPage pageNum={pageNum} totalPages={totalPages} studentName={studentName} nis={nis} studentClass={studentClass} semester={semester} academicYear={academicYear}>
      <div className="text-center mb-4">
        <h2 className="text-lg font-bold text-primary-800 tracking-wide">IB Learner Profile</h2>
        {logo && (
          <div className="flex justify-center my-2">
            <img src={logo} alt="IB Learner Profile" className="w-50 h-50 object-contain" />
          </div>
        )}
        <p className="text-[11px] text-gray-500 mt-1 italic leading-relaxed max-w-lg mx-auto">
          The aim of all IB programmes is to develop internationally minded people who, recognizing their common humanity and shared guardianship of the planet, help to create a better and more peaceful world.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {learnerProfiles.map((lp, idx) => (
          <div key={lp.name} className="border border-gray-200 rounded-md px-2.5 py-2 bg-gray-50/50">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="flex items-center justify-center w-5 h-5 bg-primary-100 text-primary-700 rounded-full text-[10px] font-bold shrink-0">
                {idx + 1}
              </span>
              <h3 className="text-[11px] font-bold text-primary-800">{lp.name}</h3>
            </div>
            <p className="text-[9px] text-gray-600 leading-[13px] pl-[26px]">{lp.description}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 text-center">
        <div className="inline-block border-t border-gray-200 pt-3 px-8">
          <p className="text-[9px] text-gray-400 italic leading-relaxed">
            &ldquo;The IB continuum of international education encourages students across the world to become
            active, compassionate and lifelong learners who understand that other people, with their differences,
            can also be right.&rdquo;
          </p>
          <p className="text-[9px] text-gray-400 mt-1.5 font-medium">{schoolName}</p>
        </div>
      </div>
    </ReportPage>
  );
}

/* ── MAIN : Report Page ──────────────────────────────────────────── */

const GRADE_OPTIONS = [7, 8, 9];

export default function Report() {
  const {
    students, subjects, grades, attendances, homeroomComments, classes,
    schoolProfile, activeYear, criteriaDescriptors,
    calculateGrade, calculateGradeDynamic, getLocalGrade, getScaledBoundaries,
    learnerProfiles, ibProfileLogo, getGradeLevelKey, getSemesterLabel, currentUser,
  } = useApp();

  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [printingStudentId, setPrintingStudentId] = useState(null);
  const [myHomeroomClass, setMyHomeroomClass] = useState(null);
  const [gradeBoundaries, setGradeBoundaries] = useState([]);

  // Fetch grade boundaries from API
  useEffect(() => {
    api.getGradeBoundaries()
      .then(data => setGradeBoundaries(data))
      .catch(() => {});
  }, []);

  const activeYearStr = activeYear?.year || '2025/2026';
  const activeSemester = activeYear?.activeSemester || 2;

  // Fetch teacher record for homeroom teachers
  useEffect(() => {
    if (currentUser?.role === 'homeroom') {
      api.getMyTeacher()
        .then(t => {
          if (t?.homeroom) {
            setMyHomeroomClass(t.homeroom);
            // Auto-select grade and class
            const gradeLevel = String(parseInt(t.homeroom));
            setSelectedGrade(gradeLevel);
            setSelectedClass(t.homeroom);
          }
        })
        .catch(() => {});
    }
    // Auto-select for students — find their own record and auto-select
    if (currentUser?.role === 'student') {
      const myStudent = students.find(s => s.name === currentUser.name);
      if (myStudent) {
        const gradeLevel = String(parseInt(myStudent.class));
        setSelectedGrade(gradeLevel);
        setSelectedClass(myStudent.class);
        setPrintingStudentId(myStudent.id);
      }
    }
  }, [currentUser, students]);

  // Classes filtered by selected grade (homeroom teachers only see their class)
  const filteredClasses = useMemo(() => {
    if (currentUser?.role === 'homeroom' && myHomeroomClass) {
      return classes.filter(c => c.name === myHomeroomClass);
    }
    if (!selectedGrade) return [];
    return classes
      .filter(c => c.level === Number(selectedGrade))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [classes, selectedGrade, currentUser, myHomeroomClass]);

  // Students filtered by selected class
  const filteredStudents = useMemo(() => {
    if (!selectedClass) return [];
    return students
      .filter(s => s.class === selectedClass && s.status === 'active')
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [students, selectedClass]);

  // Reset class when grade changes
  const handleGradeChange = (grade) => {
    setSelectedGrade(grade);
    setSelectedClass('');
    setPrintingStudentId(null);
  };

  const handleClassChange = (cls) => {
    setSelectedClass(cls);
    setPrintingStudentId(null);
  };

  // Student being printed/previewed
  const printingStudent = useMemo(
    () => students.find(s => s.id === printingStudentId),
    [students, printingStudentId]
  );

  // Gather subject grades for printing student
  const subjectGrades = useMemo(() => {
    if (!printingStudent) return [];
    return subjects.map(sub => {
      const g = grades.find(
        gr =>
          gr.studentId === printingStudent.id &&
          gr.subjectId === sub.id &&
          gr.semester === activeSemester &&
          gr.academicYear === activeYearStr
      );
      return {
        subjectId: sub.id,
        shortName: sub.shortName,
        name: sub.name,
        category: sub.category,
        criteriaCount: getCriteriaCount(sub, printingStudent ? parseInt(printingStudent.class) : null),
        scoreA: g?.scoreA ?? 0,
        scoreB: g?.scoreB ?? 0,
        scoreC: g?.scoreC ?? 0,
        scoreD: g?.scoreD ?? 0,
        hasGrade: !!g,
      };
    });
  }, [printingStudent, subjects, grades, activeSemester, activeYearStr]);

  const subjectsWithGrades = useMemo(
    () => subjectGrades.filter(sg => sg.hasGrade),
    [subjectGrades]
  );

  const attendance = useMemo(() => {
    if (!printingStudent) return null;
    return attendances.find(
      a =>
        a.studentId === printingStudent.id &&
        a.semester === activeSemester &&
        a.academicYear === activeYearStr
    ) || null;
  }, [printingStudent, attendances, activeSemester, activeYearStr]);

  const homeroomComment = useMemo(() => {
    if (!printingStudent) return null;
    return homeroomComments.find(
      c =>
        c.studentId === printingStudent.id &&
        c.semester === activeSemester &&
        c.academicYear === activeYearStr
    ) || null;
  }, [printingStudent, homeroomComments, activeSemester, activeYearStr]);

  const totalPages = useMemo(() => {
    if (!printingStudent) return 0;
    return 3 + subjectsWithGrades.length + 1;
  }, [printingStudent, subjectsWithGrades]);

  const handlePrint = (studentId) => {
    setPrintingStudentId(studentId);
    setTimeout(() => window.print(), 500);
  };

  const handlePreview = (studentId) => {
    setPrintingStudentId(prev => prev === studentId ? null : studentId);
  };

  const inputCls = 'w-full px-3 py-2 text-sm border border-warm-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 appearance-none bg-white pr-8';
  const labelCls = 'block text-xs font-medium text-gray-500 mb-1';

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 bg-primary-100 rounded-xl">
          <FileText size={20} className="text-primary-700" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-primary-900">Cetak Rapor</h1>
          <p className="text-sm text-gray-500">MYP Report Card Preview & Generation</p>
        </div>
      </div>

      {/* Filter panel — hidden for students */}
      {currentUser?.role !== 'student' && (<>
      <div className="bg-white rounded-xl border border-warm-200 shadow-sm p-5">
        <div className="flex flex-col sm:flex-row sm:items-end gap-4">
          {/* Grade filter */}
          <div className="flex-1 max-w-[200px]">
            <label className={labelCls}>Pilih Grade</label>
            <div className="relative">
              <select value={selectedGrade} onChange={e => handleGradeChange(e.target.value)} className={inputCls} disabled={currentUser?.role === 'homeroom'}>
                <option value="">-- Pilih Grade --</option>
                {GRADE_OPTIONS.map(g => (
                  <option key={g} value={g}>Grade {g}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Class filter */}
          <div className="flex-1 max-w-[200px]">
            <label className={labelCls}>Pilih Kelas</label>
            <div className="relative">
              <select value={selectedClass} onChange={e => handleClassChange(e.target.value)} className={inputCls} disabled={!selectedGrade || currentUser?.role === 'homeroom'}>
                <option value="">-- Pilih Kelas --</option>
                {filteredClasses.map(c => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Active info */}
          <div className="flex items-center gap-2 text-xs text-gray-500 pb-1">
            <span className="px-2.5 py-1 bg-warm-100 rounded-lg font-medium">{activeYearStr}</span>
            <span className="px-2.5 py-1 bg-warm-100 rounded-lg font-medium">{getSemesterLabel(activeYear, activeSemester)}</span>
          </div>
        </div>
      </div>

      {/* Student table */}
      {selectedClass && (
        <div className="bg-white rounded-xl border border-warm-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-warm-200 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gray-700">Data Siswa — Kelas {selectedClass}</h3>
              <p className="text-xs text-gray-400">{filteredStudents.length} siswa ditemukan</p>
            </div>
          </div>

          {filteredStudents.length === 0 ? (
            <div className="p-10 text-center text-gray-400 text-sm">
              Tidak ada siswa aktif di kelas {selectedClass}.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-warm-50">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-12">No</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">NISN</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Nama</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-24">Gender</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider w-40">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-warm-100">
                  {filteredStudents.map((student, idx) => (
                    <tr
                      key={student.id}
                      className={`transition-colors duration-150 ${
                        printingStudentId === student.id ? 'bg-primary-50' : 'hover:bg-warm-50/50'
                      }`}
                    >
                      <td className="px-4 py-3 text-gray-400 text-xs">{idx + 1}</td>
                      <td className="px-4 py-3 text-gray-600 font-mono text-xs">{student.nis}</td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-gray-800">{student.name}</p>
                      </td>
                      <td className="px-4 py-3">
                        {student.gender === 'L'
                          ? <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-blue-50 text-blue-700">Laki-laki</span>
                          : <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-pink-50 text-pink-700">Perempuan</span>
                        }
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handlePreview(student.id)}
                            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 flex items-center gap-1.5
                              ${printingStudentId === student.id
                                ? 'bg-primary-600 text-white'
                                : 'bg-primary-50 text-primary-700 hover:bg-primary-100'
                              }`}
                            title="Preview rapor"
                          >
                            <FileText size={13} /> Rapor
                          </button>
                          <button
                            onClick={() => handlePrint(student.id)}
                            className="px-3 py-1.5 text-xs font-medium bg-warm-100 text-gray-600 hover:bg-warm-200 rounded-lg transition-all duration-200 flex items-center gap-1.5"
                            title="Print rapor"
                          >
                            <Printer size={13} /> Print
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Placeholder when no class selected */}
      {!selectedClass && (
        <div className="bg-white rounded-xl border border-warm-200 shadow-sm p-16 text-center">
          <GraduationCap size={40} className="mx-auto mb-3 text-gray-200" />
          <p className="text-gray-400 text-sm">Pilih grade dan kelas untuk menampilkan daftar siswa.</p>
          <p className="text-gray-300 text-xs mt-1">Setelah memilih kelas, Anda dapat preview atau print rapor setiap siswa.</p>
        </div>
      )}
      </>)}

      {/* Student view — shown only for student role */}
      {currentUser?.role === 'student' && printingStudent && (
        <div className="bg-white rounded-xl border border-warm-200 shadow-sm p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                <User size={20} className="text-primary-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-800">{printingStudent.name}</h3>
                <p className="text-xs text-gray-400">NISN: {printingStudent.nis} · Kelas {printingStudent.class}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePreview(printingStudent.id)}
                className="px-4 py-2 text-sm font-medium bg-primary-50 text-primary-700 hover:bg-primary-100 rounded-lg transition-all duration-200 flex items-center gap-1.5"
              >
                <FileText size={15} /> Preview
              </button>
              <button
                onClick={() => handlePrint(printingStudent.id)}
                className="px-4 py-2 text-sm font-medium bg-primary-600 text-white hover:bg-primary-700 rounded-lg transition-all duration-200 flex items-center gap-1.5 shadow-sm"
              >
                <Download size={15} /> Download PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {currentUser?.role === 'student' && !printingStudent && (
        <div className="bg-white rounded-xl border border-warm-200 shadow-sm p-16 text-center">
          <FileText size={40} className="mx-auto mb-3 text-gray-200" />
          <p className="text-gray-400 text-sm">Rapor belum tersedia.</p>
        </div>
      )}

      {/* Report preview modal */}
      <ReportPreviewModal
        isOpen={printingStudent !== null && printingStudent !== undefined}
        onClose={() => setPrintingStudentId(null)}
        student={printingStudent}
        totalPages={totalPages}
        onPrint={() => window.print()}
      >
        {/* Page 1: Cover Letter */}
        <CoverPage
          schoolProfile={schoolProfile}
          student={printingStudent || { name: '', nis: '', class: '' }}
          semester={activeSemester}
          academicYear={activeYearStr}
          pageNum={1}
          totalPages={totalPages}
        />

        {/* Page 2: Guidelines */}
        <GuidelinesPage
          gradeBoundaries={gradeBoundaries}
          studentName={printingStudent?.name}
          nis={printingStudent?.nis}
          studentClass={printingStudent?.class}
          semester={activeSemester}
          academicYear={activeYearStr}
          pageNum={2}
          totalPages={totalPages}
        />

        {/* Page 3: Progress Summary */}
        <ProgressSummaryPage
          student={printingStudent || { name: '', nis: '', class: '' }}
          subjectGrades={subjectGrades}
          attendance={attendance}
          homeroomComment={homeroomComment}
          semester={activeSemester}
          academicYear={activeYearStr}
          calculateGradeDynamic={calculateGradeDynamic}
          getLocalGrade={getLocalGrade}
          pageNum={3}
          totalPages={totalPages}
        />

        {/* Pages 4+: Subject Detail Pages */}
        {subjectsWithGrades.map((sg, idx) => {
          const subject = subjects.find(s => s.id === sg.subjectId);
          const grade = grades.find(
            g =>
              g.studentId === printingStudent?.id &&
              g.subjectId === sg.subjectId &&
              g.semester === activeSemester &&
              g.academicYear === activeYearStr
          );
          return (
            <SubjectDetailPage
              key={sg.subjectId}
              subject={subject}
              grade={grade}
              criteriaDescriptors={criteriaDescriptors}
              gradeLevel={printingStudent ? getGradeLevelKey(printingStudent.class) : '7'}
              studentName={printingStudent?.name}
              nis={printingStudent?.nis}
              studentClass={printingStudent?.class}
              semester={activeSemester}
              academicYear={activeYearStr}
              calculateGradeDynamic={calculateGradeDynamic}
              getLocalGrade={getLocalGrade}
              getScaledBoundaries={getScaledBoundaries}
              pageNum={4 + idx}
              totalPages={totalPages}
            />
          );
        })}

        {/* Last Page: IB Learner Profile */}
        <LearnerProfilePage
          learnerProfiles={learnerProfiles}
          logo={ibProfileLogo}
          studentName={printingStudent?.name}
          nis={printingStudent?.nis}
          studentClass={printingStudent?.class}
          semester={activeSemester}
          academicYear={activeYearStr}
          pageNum={totalPages}
          totalPages={totalPages}
          schoolName={schoolProfile.name}
        />
      </ReportPreviewModal>
    </div>
  );
}
