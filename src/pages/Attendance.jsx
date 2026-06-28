import { useState, useMemo, useCallback, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import api from '../services/api';
import {
  Save, ChevronDown, Users, UserCheck, UserX, Stethoscope,
  FileCheck, AlertCircle, CheckCircle2, ClipboardList, MessageSquareText, BookOpen,
} from 'lucide-react';

const CLASS_OPTIONS = ['7A', '7B', '8A', '8B', '9A', '9B'];

const ATTENDANCE_FIELDS = [
  { key: 'present', label: 'Present', icon: UserCheck, color: 'text-emerald-600', bg: 'bg-emerald-50', ring: 'focus:ring-emerald-400' },
  { key: 'unexcused', label: 'Unexcused', icon: UserX, color: 'text-red-500', bg: 'bg-red-50', ring: 'focus:ring-red-400' },
  { key: 'sick', label: 'Sick', icon: Stethoscope, color: 'text-amber-500', bg: 'bg-amber-50', ring: 'focus:ring-amber-400' },
  { key: 'excused', label: 'Excused', icon: FileCheck, color: 'text-blue-500', bg: 'bg-blue-50', ring: 'focus:ring-blue-400' },
];

export default function Attendance() {
  const {
    students, attendances, homeroomComments, activeYear,
    upsertAttendance, updateAttendance, upsertHomeroomComment, updateHomeroomComment,
    teachers, learnerProfiles, getSemesterLabel, currentUser,
  } = useApp();

  const activeYearStr = activeYear?.year || '2025/2026';
  const activeSemester = activeYear?.activeSemester || 2;

  const [myHomeroomClass, setMyHomeroomClass] = useState(null);
  const [selectedClass, setSelectedClass] = useState('8A');
  const [selectedYear] = useState(activeYearStr);
  const [selectedSemester] = useState(activeSemester);
  const [localEdits, setLocalEdits] = useState({});
  const [commentEdits, setCommentEdits] = useState({});
  const [saveState, setSaveState] = useState('idle');
  const [savedStudents, setSavedStudents] = useState(new Set());

  // Fetch teacher record for homeroom teachers and auto-select their class
  useEffect(() => {
    if (currentUser?.role === 'homeroom') {
      api.getMyTeacher()
        .then(t => {
          if (t?.homeroom) {
            setMyHomeroomClass(t.homeroom);
            setSelectedClass(t.homeroom);
          }
        })
        .catch(() => {});
    }
  }, [currentUser?.role, currentUser?.name]); // eslint-disable-line react-hooks/exhaustive-deps

  // Students in the selected class
  const classStudents = useMemo(
    () => students.filter(s => s.class === selectedClass && s.status === 'active'),
    [students, selectedClass]
  );

  // Attendance lookup
  const attendanceLookup = useMemo(() => {
    const map = {};
    attendances.forEach(a => {
      if (a.academicYear === selectedYear && a.semester === selectedSemester) {
        map[a.studentId] = a;
      }
    });
    return map;
  }, [attendances, selectedYear, selectedSemester]);

  // Homeroom comment lookup
  const commentLookup = useMemo(() => {
    const map = {};
    homeroomComments.forEach(c => {
      if (c.academicYear === selectedYear && c.semester === selectedSemester) {
        map[c.studentId] = c;
      }
    });
    return map;
  }, [homeroomComments, selectedYear, selectedSemester]);

  // Get the homeroom teacher for this class
  const homeroomTeacher = useMemo(
    () => teachers.find(t => t.homeroom === selectedClass && t.role === 'homeroom'),
    [teachers, selectedClass]
  );

  // Get attendance value with local edit override
  const getAttendanceValue = useCallback(
    (studentId, field) => {
      if (localEdits[studentId] && localEdits[studentId][field] !== undefined) {
        return localEdits[studentId][field];
      }
      const rec = attendanceLookup[studentId];
      return rec ? (rec[field] ?? 0) : 0;
    },
    [localEdits, attendanceLookup]
  );

  // Get comment value with local edit override
  const getCommentValue = useCallback(
    (studentId) => {
      if (commentEdits[studentId] !== undefined) return commentEdits[studentId];
      const rec = commentLookup[studentId];
      return rec?.comment || '';
    },
    [commentEdits, commentLookup]
  );

  const handleAttendanceChange = (studentId, field, rawValue) => {
    const val = rawValue === '' ? '' : Math.max(0, Number(rawValue));
    setLocalEdits(prev => ({
      ...prev,
      [studentId]: { ...(prev[studentId] || {}), [field]: val },
    }));
    setSaveState('idle');
    setSavedStudents(prev => {
      const next = new Set(prev);
      next.delete(studentId);
      return next;
    });
  };

  const handleCommentChange = (studentId, value) => {
    setCommentEdits(prev => ({ ...prev, [studentId]: value }));
    setSaveState('idle');
    setSavedStudents(prev => {
      const next = new Set(prev);
      next.delete(studentId);
      return next;
    });
  };

  const getTotalDays = (studentId) => {
    return ATTENDANCE_FIELDS.reduce((sum, f) => {
      const v = getAttendanceValue(studentId, f.key);
      return sum + (v === '' ? 0 : Number(v));
    }, 0);
  };

  const handleSave = () => {
    setSaveState('saving');
    try {
      const newSaved = new Set();

      classStudents.forEach(student => {
        const attEdits = localEdits[student.id];
        const comEdit = commentEdits[student.id];

        // Save attendance
        if (attEdits) {
          const present = attEdits.present !== undefined ? attEdits.present : (attendanceLookup[student.id]?.present ?? 0);
          const unexcused = attEdits.unexcused !== undefined ? attEdits.unexcused : (attendanceLookup[student.id]?.unexcused ?? 0);
          const sick = attEdits.sick !== undefined ? attEdits.sick : (attendanceLookup[student.id]?.sick ?? 0);
          const excused = attEdits.excused !== undefined ? attEdits.excused : (attendanceLookup[student.id]?.excused ?? 0);

          const existing = attendanceLookup[student.id];
          if (existing) {
            updateAttendance(existing.id, {
              present: Number(present) || 0,
              unexcused: Number(unexcused) || 0,
              sick: Number(sick) || 0,
              excused: Number(excused) || 0,
            });
          } else {
            upsertAttendance({
              studentId: student.id,
              semester: selectedSemester,
              academicYear: selectedYear,
              present: Number(present) || 0,
              unexcused: Number(unexcused) || 0,
              sick: Number(sick) || 0,
              excused: Number(excused) || 0,
            });
          }
        }

        // Save comment
        if (comEdit !== undefined) {
          const existing = commentLookup[student.id];
          if (existing) {
            updateHomeroomComment(existing.id, { comment: comEdit });
          } else if (comEdit.trim()) {
            upsertHomeroomComment({
              studentId: student.id,
              semester: selectedSemester,
              academicYear: selectedYear,
              teacherName: homeroomTeacher?.name || 'Homeroom Teacher',
              comment: comEdit,
            });
          }
        }

        newSaved.add(student.id);
      });

      setLocalEdits({});
      setCommentEdits({});
      setSavedStudents(newSaved);
      setSaveState('saved');
      setTimeout(() => { setSaveState('idle'); setSavedStudents(new Set()); }, 3000);
    } catch {
      setSaveState('error');
    }
  };

  const hasChanges = Object.keys(localEdits).length > 0 || Object.keys(commentEdits).length > 0;

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 bg-primary-100 rounded-xl">
            <ClipboardList size={20} className="text-primary-700" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-primary-900">Kehadiran & Catatan Homeroom</h1>
            <p className="text-sm text-gray-500">Attendance & Homeroom Teacher Comments</p>
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="bg-white rounded-xl border border-warm-200 shadow-sm p-4">
        <div className="flex flex-col sm:flex-row sm:items-end gap-3">
          <div className="flex-1 max-w-xs">
            <label className="block text-xs font-medium text-gray-500 mb-1">Kelas</label>
            <div className="relative">
              <select
                value={selectedClass}
                onChange={e => { setSelectedClass(e.target.value); setLocalEdits({}); setCommentEdits({}); }}
                disabled={currentUser?.role === 'homeroom'}
                className="w-full px-3 py-2 text-sm border border-warm-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 appearance-none bg-white pr-8 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {currentUser?.role === 'homeroom' && myHomeroomClass ? (
                  <option key={myHomeroomClass} value={myHomeroomClass}>{myHomeroomClass}</option>
                ) : (
                  CLASS_OPTIONS.map(cls => (
                    <option key={cls} value={cls}>{cls}</option>
                  ))
                )}
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span className="px-2.5 py-1 bg-warm-100 rounded-lg font-medium">{activeYearStr}</span>
            <span className="px-2.5 py-1 bg-warm-100 rounded-lg font-medium">{getSemesterLabel(activeYear, activeSemester)}</span>
            {homeroomTeacher && (
              <span className="px-2.5 py-1 bg-primary-50 text-primary-700 rounded-lg font-medium">
                Wali Kelas: {homeroomTeacher.name}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Student count badge */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Users size={15} />
        <span>{classStudents.length} siswa di kelas {selectedClass}</span>
      </div>

      {/* Student cards */}
      {classStudents.length === 0 ? (
        <div className="bg-white rounded-xl border border-warm-200 shadow-sm p-12 text-center">
          <AlertCircle size={24} className="mx-auto mb-2 text-gray-300" />
          <p className="text-gray-400">Tidak ada siswa di kelas {selectedClass}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {classStudents.map((student, idx) => {
            const total = getTotalDays(student.id);
            const comment = getCommentValue(student.id);
            const isJustSaved = savedStudents.has(student.id);

            return (
              <div
                key={student.id}
                className={`bg-white rounded-xl border shadow-sm overflow-hidden transition-all duration-300 ${
                  isJustSaved ? 'border-emerald-300 ring-1 ring-emerald-200' : 'border-warm-200'
                }`}
              >
                {/* Student header */}
                <div className="px-5 py-3 bg-warm-50 border-b border-warm-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-primary-100 text-primary-700 rounded-lg text-sm font-bold">
                      {idx + 1}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800 text-sm">{student.name}</h3>
                      <span className="text-xs text-gray-400">NISN: {student.nis}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isJustSaved && (
                      <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                        <CheckCircle2 size={13} /> Tersimpan
                      </span>
                    )}
                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-md">
                      Total: {total} hari
                    </span>
                  </div>
                </div>

                {/* Card body */}
                <div className="p-5 space-y-4">
                  {/* Attendance inputs */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      Data Kehadiran
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {ATTENDANCE_FIELDS.map(({ key, label, icon: Icon, color, bg, ring }) => (
                        <div key={key} className={`${bg} rounded-lg p-3`}>
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <Icon size={14} className={color} />
                            <label className="text-xs font-medium text-gray-600">{label}</label>
                          </div>
                          <input
                            type="number"
                            min={0}
                            value={getAttendanceValue(student.id, key)}
                            onChange={e => handleAttendanceChange(student.id, key, e.target.value)}
                            className={`w-full px-3 py-2 text-sm border border-warm-200 rounded-lg focus:outline-none focus:ring-2 ${ring} bg-white text-center font-semibold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Homeroom comment */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <MessageSquareText size={14} className="text-primary-600" />
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Catatan Wali Kelas (Homeroom Teacher Comment)
                      </label>
                    </div>
                    <div className="relative">
                      <textarea
                        value={comment}
                        onChange={e => handleCommentChange(student.id, e.target.value)}
                        rows={4}
                        placeholder="Describe the student's development, referencing IB Learner Profile attributes (e.g., Inquirer, Communicator, Principled)..."
                        className="w-full px-4 py-3 text-sm border border-warm-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 resize-y leading-relaxed placeholder:text-gray-300"
                      />
                    </div>
                    {/* IB Learner Profile hint chips */}
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      <span className="text-[10px] text-gray-400 mr-1 self-center">IB Learner Profile:</span>
                      {learnerProfiles.map(lp => (
                        <button
                          key={lp.name}
                          type="button"
                          onClick={() => {
                            const current = getCommentValue(student.id);
                            const addition = current && !current.endsWith(' ') && !current.endsWith('\n') ? ' ' : '';
                            handleCommentChange(student.id, current + addition + lp.name);
                          }}
                          className="px-2 py-0.5 text-[10px] font-medium bg-primary-50 text-primary-700 rounded-full hover:bg-primary-100 transition-colors duration-150"
                        >
                          {lp.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Global save bar */}
      <div className="sticky bottom-4 z-10">
        <div className="bg-white rounded-xl border border-warm-200 shadow-lg px-5 py-3.5 flex items-center justify-between">
          <div className="text-xs text-gray-500">
            {classStudents.length} siswa &middot; Kelas {selectedClass}
            {hasChanges && (
              <span className="ml-2 text-gold-600 font-medium">
                Perubahan belum disimpan
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {saveState === 'saved' && (
              <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                <CheckCircle2 size={14} /> Semua data tersimpan
              </span>
            )}
            {saveState === 'error' && (
              <span className="flex items-center gap-1 text-xs text-red-500 font-medium">
                <AlertCircle size={14} /> Gagal menyimpan
              </span>
            )}
            <button
              onClick={handleSave}
              disabled={saveState === 'saving' || !hasChanges}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-all duration-200 flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Save size={15} />
              {saveState === 'saving' ? 'Menyimpan...' : 'Simpan Semua'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
