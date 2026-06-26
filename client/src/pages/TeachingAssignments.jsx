import { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import api from '../services/api';
import { BookOpenCheck, ChevronDown, Trash2, Save, CheckCircle2 } from 'lucide-react';

const GRADE_OPTIONS = [7, 8, 9];

export default function TeachingAssignments() {
  const { subjects, teachers, classes, activeYear, getCriteriaCount, getSemesterLabel } = useApp();
  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [assignments, setAssignments] = useState([]);
  const [localEdits, setLocalEdits] = useState({});
  const [saveState, setSaveState] = useState('idle');

  // Filter classes by selected grade
  const filteredClasses = useMemo(() => {
    if (!selectedGrade) return [];
    return classes
      .filter(c => c.level === Number(selectedGrade))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [classes, selectedGrade]);

  // Filter subjects available for the selected grade
  const filteredSubjects = useMemo(() => {
    if (!selectedGrade) return [];
    const g = Number(selectedGrade);
    return subjects
      .filter(s => !s.availableGrades || s.availableGrades.includes(g))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [subjects, selectedGrade]);

  // Load assignments when class changes
  useEffect(() => {
    if (!selectedClass) { setAssignments([]); return; }
    api.getTeachingAssignments(selectedClass)
      .then(data => setAssignments(data))
      .catch(err => console.warn(err.message));
  }, [selectedClass]);

  // Reset on grade change
  const handleGradeChange = (grade) => {
    setSelectedGrade(grade);
    setSelectedClass('');
    setAssignments([]);
    setLocalEdits({});
  };

  // Get assigned teacher for a subject
  const getAssignedTeacher = (subjectId) => {
    // Check local edits first
    if (localEdits[subjectId] !== undefined) return localEdits[subjectId];
    // Check existing assignments
    const found = assignments.find(a => a.subjectId === subjectId);
    return found?.teacherId || '';
  };

  // Get assignment ID for a subject (for delete)
  const getAssignmentId = (subjectId) => {
    const found = assignments.find(a => a.subjectId === subjectId);
    return found?.id || null;
  };

  const handleTeacherChange = (subjectId, teacherId) => {
    setLocalEdits(prev => ({ ...prev, [subjectId]: teacherId }));
    setSaveState('idle');
  };

  const handleDelete = async (subjectId) => {
    const assignmentId = getAssignmentId(subjectId);
    if (assignmentId) {
      try {
        await api.deleteTeachingAssignment(assignmentId);
        setAssignments(prev => prev.filter(a => a.id !== assignmentId));
        // Clear local edit too
        setLocalEdits(prev => {
          const next = { ...prev };
          delete next[subjectId];
          return next;
        });
      } catch (err) {
        console.warn(err.message);
      }
    } else {
      // Just clear the local edit
      setLocalEdits(prev => {
        const next = { ...prev };
        delete next[subjectId];
        return next;
      });
    }
  };

  const handleSave = async () => {
    setSaveState('saving');
    try {
      const entries = Object.entries(localEdits);
      for (const [subjectId, teacherId] of entries) {
        if (!teacherId) continue; // skip empty selections
        // Delete existing assignment for this subject in this class first
        const existingId = getAssignmentId(Number(subjectId));
        if (existingId) {
          try { await api.deleteTeachingAssignment(existingId); } catch {}
        }
        // Create new assignment
        await api.assignTeacher({
          className: selectedClass,
          subjectId: Number(subjectId),
          teacherId: Number(teacherId),
        });
      }
      // Refresh assignments from API
      const fresh = await api.getTeachingAssignments(selectedClass);
      setAssignments(fresh);
      setLocalEdits({});
      setSaveState('saved');
      setTimeout(() => setSaveState('idle'), 2500);
    } catch {
      setSaveState('error');
    }
  };

  const hasEdits = Object.keys(localEdits).length > 0;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 bg-primary-100 rounded-xl">
          <BookOpenCheck size={20} className="text-primary-700" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-primary-900">Mengajar</h1>
          <p className="text-sm text-gray-500">Atur guru pengajar mata pelajaran per kelas</p>
        </div>
      </div>

      {/* Filter bar */}
      <div className="bg-white rounded-xl border border-warm-200 shadow-sm p-4">
        <div className="flex flex-col sm:flex-row sm:items-end gap-3">
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
                {GRADE_OPTIONS.map(g => (
                  <option key={g} value={g}>Grade {g}</option>
                ))}
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
                onChange={e => { setSelectedClass(e.target.value); setLocalEdits({}); }}
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
        </div>
      </div>

      {/* Table */}
      {selectedClass ? (
        <div className="bg-white rounded-xl border border-warm-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-primary-700">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-primary-100 w-12">No</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-primary-100 min-w-[200px]">Mata Pelajaran</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-primary-100 min-w-[250px]">Guru</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-primary-100 w-20">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-warm-100">
                {filteredSubjects.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-12 text-center text-gray-400 text-sm">
                      Tidak ada mata pelajaran untuk grade ini.
                    </td>
                  </tr>
                ) : (
                  filteredSubjects.map((subject, idx) => {
                    const assignedTeacherId = getAssignedTeacher(subject.id);
                    const hasAssignment = !!getAssignmentId(subject.id) || (localEdits[subject.id] !== undefined && localEdits[subject.id] !== '');
                    return (
                      <tr key={subject.id} className="hover:bg-warm-50/50 transition-colors duration-100">
                        <td className="px-4 py-3 text-gray-400 text-xs">{idx + 1}</td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-800">{subject.shortName}</div>
                          <div className="text-[11px] text-gray-400 mt-0.5">{subject.category}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="relative">
                            <select
                              value={assignedTeacherId}
                              onChange={e => handleTeacherChange(subject.id, e.target.value)}
                              className="w-full px-3 py-2 text-sm border border-warm-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 appearance-none bg-white pr-8"
                            >
                              <option value="">-- Pilih Guru --</option>
                              {teachers
                                .filter(t => t.role !== 'admin')
                                .sort((a, b) => a.name.localeCompare(b.name))
                                .map(t => {
                                  const roleLabel = t.role === 'homeroom' ? 'Wali Kelas' : t.role === 'subject' ? 'Guru Mapel' : t.role;
                                  return (
                                    <option key={t.id} value={t.id}>{t.name} ({roleLabel})</option>
                                  );
                                })}
                            </select>
                            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {hasAssignment && (
                            <button
                              onClick={() => handleDelete(subject.id)}
                              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all duration-200"
                              title="Hapus penugasan"
                            >
                              <Trash2 size={16} />
                            </button>
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
          {hasEdits && (
            <div className="px-5 py-3.5 border-t border-warm-200 bg-warm-50/60 flex items-center justify-between">
              <div className="text-xs text-gray-500">
                <span className="ml-2 text-gold-600 font-medium">
                  ({Object.keys(localEdits).length} perubahan belum disimpan)
                </span>
              </div>
              <div className="flex items-center gap-2">
                {saveState === 'saved' && (
                  <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                    <CheckCircle2 size={14} /> Tersimpan
                  </span>
                )}
                <button
                  onClick={handleSave}
                  disabled={saveState === 'saving'}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-all duration-200 flex items-center gap-2 disabled:opacity-40"
                >
                  <Save size={15} />
                  {saveState === 'saving' ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-warm-200 shadow-sm p-16 text-center">
          <BookOpenCheck size={40} className="mx-auto mb-3 text-gray-200" />
          <p className="text-gray-400 text-sm">
            {!selectedGrade ? 'Pilih Grade terlebih dahulu.' : 'Pilih Kelas untuk menampilkan daftar mata pelajaran.'}
          </p>
        </div>
      )}
    </div>
  );
}
