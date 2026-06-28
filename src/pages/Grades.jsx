import { useState, useMemo, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import api from '../services/api';
import { getCriteriaKeys, getCriteriaCount } from '../data/dummyData';
import { Save, ChevronDown, BookOpen, AlertCircle, CheckCircle2, BarChart3 } from 'lucide-react';

const SEMESTER_OPTIONS = [1, 2];

function getGradeBadgeClasses(grade) {
  if (!grade) return 'bg-gray-100 text-gray-400';
  if (grade <= 2) return 'bg-red-100 text-red-700 ring-1 ring-red-200';
  if (grade === 3) return 'bg-orange-100 text-orange-700 ring-1 ring-orange-200';
  if (grade === 4) return 'bg-yellow-100 text-yellow-800 ring-1 ring-yellow-200';
  if (grade === 5) return 'bg-gold-100 text-gold-700 ring-1 ring-gold-300';
  if (grade === 6) return 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200';
  if (grade === 7) return 'bg-primary-100 text-primary-800 ring-1 ring-primary-200';
  return 'bg-gray-100 text-gray-400';
}

export default function Grades() {
  const {
    students, subjects, grades, classes, academicYears, activeYear,
    calculateGrade, calculateGradeDynamic, getLocalGrade, getScaledBoundaries,
    upsertGrade, updateGrade, getSemesterLabel, currentUser,
  } = useApp();

  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState(null);
  const [localEdits, setLocalEdits] = useState({});
  const [saveState, setSaveState] = useState('idle'); // idle | saving | saved | error
  const [myAssignments, setMyAssignments] = useState([]);

  // Fetch teaching assignments when class changes (for subject and homeroom teachers)
  const isTeacherRole = currentUser?.role === 'subject' || currentUser?.role === 'homeroom';

  useEffect(() => {
    if (!selectedClass || !isTeacherRole) {
      setMyAssignments([]);
      return;
    }
    api.getTeachingAssignments(selectedClass)
      .then(data => {
        const mine = data.filter(a => a.teacher?.name === currentUser?.name);
        setMyAssignments(mine);
      })
      .catch(() => setMyAssignments([]));
  }, [selectedClass, currentUser]); // eslint-disable-line react-hooks/exhaustive-deps

  const selectedYear = activeYear?.year || '2025/2026';
  const selectedSemester = activeYear?.activeSemester || 2;

  const selectedYearObj = academicYears.find(y => y.year === selectedYear) || activeYear;

  // Classes filtered by selected grade
  const filteredClasses = useMemo(() => {
    if (!selectedGrade) return [];
    return classes
      .filter(c => c.level === Number(selectedGrade))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [classes, selectedGrade]);

  // Subjects available for the selected grade, filtered by teaching assignment for teachers
  const filteredSubjects = useMemo(() => {
    if (!selectedGrade) return subjects;
    const g = Number(selectedGrade);
    let list = subjects.filter(s => !s.availableGrades || s.availableGrades.includes(g));
    // Subject and homeroom teachers only see their assigned subjects
    if (isTeacherRole && selectedClass && myAssignments.length > 0) {
      const assignedSubjectIds = myAssignments.map(a => a.subjectId);
      list = list.filter(s => assignedSubjectIds.includes(s.id));
    } else if (isTeacherRole && selectedClass && myAssignments.length === 0) {
      list = []; // No assignments = no subjects to show
    }
    return list;
  }, [subjects, selectedGrade, currentUser, selectedClass, myAssignments]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-select first class and subject when grade changes
  const handleGradeChange = (grade) => {
    setSelectedGrade(grade);
    setSelectedClass('');
    setSelectedSubjectId(null);
    setLocalEdits({});
  };
  const handleClassChange = (cls) => {
    setSelectedClass(cls);
    setLocalEdits({});
  };

  // Students in selected class
  const classStudents = useMemo(
    () => students.filter(s => s.class === selectedClass && s.status === 'active'),
    [students, selectedClass]
  );

  // Build a lookup: studentId -> grade record (original from context)
  const gradeLookup = useMemo(() => {
    const map = {};
    grades.forEach(g => {
      if (
        g.academicYear === selectedYear &&
        g.semester === selectedSemester &&
        g.subjectId === selectedSubjectId
      ) {
        map[g.studentId] = g;
      }
    });
    return map;
  }, [grades, selectedYear, selectedSemester, selectedSubjectId]);

  const subject = subjects.find(s => s.id === selectedSubjectId);
  const classGradeLevel = parseInt(selectedClass) || null;
  const criteriaCount = getCriteriaCount(subject, classGradeLevel);
  const criteria = getCriteriaKeys(criteriaCount);
  const maxScore = criteriaCount * 8;
  const scaledBoundaries = getScaledBoundaries(criteriaCount);

  // Resolve score for a student/criterion: localEdits overrides gradeLookup
  const getScore = useCallback(
    (studentId, criterion) => {
      const key = `${studentId}`;
      if (localEdits[key] && localEdits[key][criterion] !== undefined) {
        return localEdits[key][criterion];
      }
      const rec = gradeLookup[studentId];
      if (!rec) return '';
      const val = rec[`score${criterion}`];
      return val !== undefined && val !== null ? val : '';
    },
    [localEdits, gradeLookup]
  );

  const getTotal = useCallback(
    (studentId) => {
      const scores = criteria.map(c => {
        const v = getScore(studentId, c);
        return v === '' ? 0 : Number(v);
      });
      return scores.reduce((a, b) => a + b, 0);
    },
    [getScore, criteria]
  );

  const hasAnyScore = useCallback(
    (studentId) => criteria.some(c => getScore(studentId, c) !== ''),
    [getScore, criteria]
  );

  const handleScoreChange = (studentId, criterion, rawValue) => {
    let val = rawValue === '' ? '' : Math.min(8, Math.max(0, Number(rawValue)));
    setLocalEdits(prev => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || {}),
        [criterion]: val,
      },
    }));
    setSaveState('idle');
  };

  const handleSave = () => {
    setSaveState('saving');
    try {
      classStudents.forEach(student => {
        const edits = localEdits[student.id];
        if (!edits) return; // no changes for this student

        // Build score object dynamically from active criteria
        const scores = {};
        let hasAny = false;
        criteria.forEach(c => {
          const val = edits[c] !== undefined ? edits[c] : (gradeLookup[student.id]?.[`score${c}`] ?? '');
          scores[c] = val;
          if (val !== '') hasAny = true;
        });
        if (!hasAny) return;

        // Build the record with all possible score fields (inactive = 0)
        const scoreRecord = {};
        ['A', 'B', 'C', 'D'].forEach(c => {
          const v = scores[c];
          scoreRecord[`score${c}`] = v !== undefined && v !== '' ? Number(v) : 0;
        });

        const existing = gradeLookup[student.id];
        if (existing) {
          updateGrade(existing.id, scoreRecord);
        } else {
          upsertGrade({
            studentId: student.id,
            subjectId: selectedSubjectId,
            semester: selectedSemester,
            academicYear: selectedYear,
            ...scoreRecord,
          });
        }
      });

      setLocalEdits({});
      setSaveState('saved');
      setTimeout(() => setSaveState('idle'), 2500);
    } catch {
      setSaveState('error');
    }
  };

  // Stats for the bottom bar
  const filledCount = classStudents.filter(s => hasAnyScore(s.id)).length;

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 bg-primary-100 rounded-xl">
          <BarChart3 size={20} className="text-primary-700" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-primary-900">Input Nilai</h1>
          <p className="text-sm text-gray-500">MYP Criterion-Based Grade Entry</p>
        </div>
      </div>

      {/* Filter bar */}
      <div className="bg-white rounded-xl border border-warm-200 shadow-sm p-4">
        <div className="flex flex-col sm:flex-row sm:items-end gap-3">
          {/* Active year & semester info */}
          <div className="flex items-center gap-2 text-xs text-gray-500 pb-1">
            <span className="px-2.5 py-1 bg-warm-100 rounded-lg font-medium">{selectedYear}</span>
            <span className="px-2.5 py-1 bg-warm-100 rounded-lg font-medium">{getSemesterLabel(activeYear, selectedSemester)}</span>
          </div>

          <div className="flex-1" />

          {/* Grade */}
          <div className="flex-1 max-w-[200px]">
            <label className="block text-xs font-medium text-gray-500 mb-1">Grade</label>
            <div className="relative">
              <select
                value={selectedGrade}
                onChange={e => handleGradeChange(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-warm-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 appearance-none bg-white pr-8"
              >
                <option value="">-- Pilih Grade --</option>
                <option value="7">Grade 7</option>
                <option value="8">Grade 8</option>
                <option value="9">Grade 9</option>
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Kelas */}
          <div className="flex-1 max-w-[200px]">
            <label className="block text-xs font-medium text-gray-500 mb-1">Kelas</label>
            <div className="relative">
              <select
                value={selectedClass}
                onChange={e => handleClassChange(e.target.value)}
                disabled={!selectedGrade}
                className="w-full px-3 py-2 text-sm border border-warm-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 appearance-none bg-white pr-8 disabled:opacity-50"
              >
                <option value="">-- Pilih Kelas --</option>
                {filteredClasses.map(c => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Mata Pelajaran */}
          <div className="flex-1 max-w-[200px]">
            <label className="block text-xs font-medium text-gray-500 mb-1">Mata Pelajaran</label>
            <div className="relative">
              <select
                value={selectedSubjectId || ''}
                onChange={e => { setSelectedSubjectId(Number(e.target.value)); setLocalEdits({}); }}
                disabled={!selectedGrade}
                className="w-full px-3 py-2 text-sm border border-warm-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 appearance-none bg-white pr-8 disabled:opacity-50"
              >
                <option value="">-- Pilih Mapel --</option>
                {filteredSubjects.map(s => (
                  <option key={s.id} value={s.id}>{s.shortName}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Subject info strip */}
      {subject && selectedClass && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-primary-50 border border-primary-100 rounded-xl text-sm">
          <BookOpen size={16} className="text-primary-600 shrink-0" />
          <span className="font-medium text-primary-800">{subject.name}</span>
          <span className="text-primary-400 mx-1">|</span>
          <span className="text-primary-600">Kelas {selectedClass}</span>
          <span className="text-primary-400 mx-1">|</span>
          <span className="text-primary-600">{filledCount}/{classStudents.length} siswa terisi</span>
        </div>
      )}

      {/* Placeholder when selection incomplete */}
      {(!selectedGrade || !selectedClass || !selectedSubjectId) && (
        <div className="bg-white rounded-xl border border-warm-200 shadow-sm p-16 text-center">
          <BarChart3 size={40} className="mx-auto mb-3 text-gray-200" />
          <p className="text-gray-400 text-sm">
            {!selectedGrade ? 'Pilih Grade terlebih dahulu.' : !selectedClass ? 'Pilih Kelas untuk melanjutkan.' : 'Pilih Mata Pelajaran untuk mulai input nilai.'}
          </p>
        </div>
      )}

      {/* Grade grid */}
      {selectedGrade && selectedClass && selectedSubjectId && (
        <>
      <div className="bg-white rounded-xl border border-warm-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-primary-700">
                <th className="px-3 py-3 text-left text-xs font-semibold text-primary-100 w-12">No</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-primary-100 min-w-[200px]">Nama Siswa</th>
                {criteria.map(c => (
                  <th key={c} className="px-2 py-3 text-center text-xs font-semibold text-primary-100 w-20">
                    <div>Kriteria {c}</div>
                    <div className="text-[10px] font-normal text-primary-300 mt-0.5">(0-8)</div>
                  </th>
                ))}
                <th className="px-3 py-3 text-center text-xs font-semibold text-primary-100 w-16">Total</th>
                <th className="px-3 py-3 text-center text-xs font-semibold text-primary-100 w-24">Final Grade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-warm-100">
              {classStudents.length === 0 ? (
                <tr>
                  <td colSpan={criteria.length + 4} className="px-4 py-12 text-center text-gray-400">
                    <AlertCircle size={20} className="inline-block mb-2 text-gray-300" />
                    <p>Tidak ada siswa di kelas {selectedClass}</p>
                  </td>
                </tr>
              ) : (
                classStudents.map((student, idx) => {
                  const total = getTotal(student.id);
                  const hasScores = hasAnyScore(student.id);
                  const finalGrade = hasScores ? calculateGradeDynamic(total, criteriaCount) : null;
                  const localGrade = finalGrade ? getLocalGrade(finalGrade) : '-';

                  return (
                    <tr key={student.id} className="hover:bg-warm-50/50 transition-colors duration-100 group">
                      <td className="px-3 py-2 text-gray-400 text-xs font-medium">{idx + 1}</td>
                      <td className="px-3 py-2">
                        <div className="font-medium text-gray-800 text-sm leading-tight">{student.name}</div>
                        <div className="text-[11px] text-gray-400 mt-0.5">NISN: {student.nis}</div>
                      </td>
                      {criteria.map(c => (
                        <td key={c} className="px-1.5 py-1.5 text-center">
                          <input
                            type="number"
                            min={0}
                            max={8}
                            value={getScore(student.id, c)}
                            onChange={e => handleScoreChange(student.id, c, e.target.value)}
                            className="w-14 px-1 py-1.5 text-sm text-center border border-warm-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent transition-all duration-150 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            placeholder="—"
                          />
                        </td>
                      ))}
                      <td className="px-3 py-2 text-center">
                        <span className={`inline-block min-w-[2.5rem] px-2 py-1 text-sm font-bold rounded-lg ${hasScores ? 'bg-primary-50 text-primary-800' : 'bg-gray-50 text-gray-300'}`}>
                          {hasScores ? total : '—'}
                          {hasScores && <span className="text-[10px] font-normal text-gray-400">/{maxScore}</span>}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-center">
                        {hasScores && finalGrade ? (
                          <div className="flex flex-col items-center gap-0.5">
                            <span className={`inline-flex items-center justify-center w-9 h-9 text-base font-bold rounded-full ${getGradeBadgeClasses(finalGrade)}`}>
                              {finalGrade}
                            </span>
                            <span className="text-[10px] text-gray-400 font-medium">{localGrade}</span>
                          </div>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Bottom bar */}
        <div className="px-5 py-3.5 border-t border-warm-200 bg-warm-50/60 flex items-center justify-between">
          <div className="text-xs text-gray-500">
            {classStudents.length} siswa &middot; {filledCount} sudah dinilai
            {Object.keys(localEdits).length > 0 && (
              <span className="ml-2 text-gold-600 font-medium">
                ({Object.keys(localEdits).length} perubahan belum disimpan)
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {saveState === 'saved' && (
              <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                <CheckCircle2 size={14} /> Tersimpan
              </span>
            )}
            {saveState === 'error' && (
              <span className="flex items-center gap-1 text-xs text-red-500 font-medium">
                <AlertCircle size={14} /> Gagal menyimpan
              </span>
            )}
            <button
              onClick={handleSave}
              disabled={saveState === 'saving' || Object.keys(localEdits).length === 0}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-all duration-200 flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Save size={15} />
              {saveState === 'saving' ? 'Menyimpan...' : 'Simpan Nilai'}
            </button>
          </div>
        </div>
      </div>

      {/* Grade boundary reference */}
      <div className="bg-white rounded-xl border border-warm-200 shadow-sm p-4">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          MYP Grade Boundaries Reference
          {criteriaCount !== 4 && (
            <span className="ml-2 text-primary-500 normal-case">(Skala {maxScore} — {criteria.length} kriteria)</span>
          )}
        </h3>
        <div className="flex flex-wrap gap-2">
          {scaledBoundaries.map(b => (
            <div key={b.grade} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium ${getGradeBadgeClasses(b.grade)}`}>
              <span className="font-bold text-sm">Grade {b.grade}</span>
              <span className="opacity-70">{b.min}-{b.max}</span>
            </div>
          ))}
        </div>
      </div>
        </>
      )}
    </div>
  );
}
