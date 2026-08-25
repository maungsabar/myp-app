import { useState, useMemo, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import api from '../services/api';
import { ArrowUpCircle, GraduationCap, CheckCircle2, AlertTriangle, ChevronRight } from 'lucide-react';

// Tooltip peringatan — muncul saat hover ikon ⚠, tidak mempengaruhi tinggi kolom grid
function WarningTooltip({ msg }) {
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);

  return (
    <span
      ref={ref}
      className="relative inline-flex items-center"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      <AlertTriangle size={13} className="text-amber-500 cursor-help shrink-0" />
      {visible && (
        <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-60 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-700 shadow-lg">
          {msg}
          {/* Panah ke bawah */}
          <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-amber-200" />
        </span>
      )}
    </span>
  );
}

export default function PromoteClass() {
  const { students, updateStudent, alumni, setAlumni, addAlumni, activeYear, academicYears, classes, selectedAcademicYearId } = useApp();

  // ─── Step 1: Grade selection ───────────────────────────────────────
  const [selectedGrade, setSelectedGrade] = useState('');
  // ─── Step 2: Class selection ───────────────────────────────────────
  const [sourceClassId, setSourceClassId] = useState('');
  // ─── Step 3: Target class selection ───────────────────────────────
  const [targetClassId, setTargetClassId] = useState('');
  const [targetClasses, setTargetClasses] = useState([]);

  const [selectedIds, setSelectedIds] = useState([]);
  const [successMsg, setSuccessMsg] = useState('');

  // All classes for the currently selected academic year
  const sourceClasses = useMemo(() => {
    if (!selectedAcademicYearId) return [];
    return classes
      .filter(c => c.academicYearId === selectedAcademicYearId)
      .sort((a, b) => a.level - b.level || a.name.localeCompare(b.name));
  }, [classes, selectedAcademicYearId]);

  // Unique sorted list of grades available in this academic year
  const availableGrades = useMemo(() => {
    const levels = [...new Set(sourceClasses.map(c => c.level))].sort((a, b) => a - b);
    return levels;
  }, [sourceClasses]);

  // Classes belonging to the selected grade
  const filteredSourceClasses = useMemo(() => {
    if (!selectedGrade) return [];
    return sourceClasses.filter(c => c.level === Number(selectedGrade));
  }, [sourceClasses, selectedGrade]);

  // The selected source class object
  const sourceClass = useMemo(() => {
    if (!sourceClassId) return null;
    return filteredSourceClasses.find(c => c.id === Number(sourceClassId)) || null;
  }, [filteredSourceClasses, sourceClassId]);

  // Determine the next academic year
  const nextAcademicYear = useMemo(() => {
    if (!selectedAcademicYearId || academicYears.length === 0) return null;
    const currentYear = academicYears.find(y => y.id === selectedAcademicYearId);
    if (!currentYear) return null;

    // Academic year format: "2025/2026"
    // Next year: "2026/2027"
    const parts = currentYear.year.split('/');
    if (parts.length === 2) {
      const startYear = parseInt(parts[0], 10);
      const endYear = parseInt(parts[1], 10);
      const nextYearStr = `${startYear + 1}/${endYear + 1}`;
      return academicYears.find(y => y.year === nextYearStr) || null;
    }
    return null;
  }, [selectedAcademicYearId, academicYears]);

  // ─── Cascade reset: when grade changes, reset class & target ───────
  const handleGradeChange = (grade) => {
    setSelectedGrade(grade);
    setSourceClassId('');
    setSelectedIds([]);
    setTargetClassId('');
    setTargetClasses([]);
  };

  // ─── Cascade reset: when source class changes, reset target ────────
  const handleSourceClassChange = (classId) => {
    setSourceClassId(classId);
    setSelectedIds([]);
    setTargetClassId('');
  };

  // When sourceClass changes, fetch target classes from next academic year with next grade level
  useEffect(() => {
    setTargetClassId('');
    setTargetClasses([]);

    if (!sourceClass || !nextAcademicYear) return;

    const nextLevel = sourceClass.level + 1;

    // Grade 9 has no next class (graduates)
    if (nextLevel > 9) return;

    // Fetch classes from the next academic year filtered by level
    api.getClasses({ academicYearId: nextAcademicYear.id, level: nextLevel })
      .then(data => {
        const mapped = data.map(({ homeroomTeacher, ...rest }) => rest);
        setTargetClasses(mapped.sort((a, b) => a.name.localeCompare(b.name)));
      })
      .catch(() => {
        setTargetClasses([]);
      });
  }, [sourceClass, nextAcademicYear]);

  const isGradeNine = sourceClass?.level === 9;

  // Filter students by source class name and active status
  const classStudents = useMemo(
    () => students.filter(s => sourceClass && s.class === sourceClass.name && s.status === 'active'),
    [students, sourceClass]
  );

  const toggleAll = (checked) => {
    setSelectedIds(checked ? classStudents.map(s => s.id) : []);
  };

  const toggleOne = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  // ─── Business logic: UNCHANGED ────────────────────────────────────
  const handlePromote = async () => {
    if (selectedIds.length === 0) {
      alert('Pilih minimal satu siswa.');
      return;
    }

    if (isGradeNine) {
      // Graduate to alumni
      const graduating = students.filter(s => selectedIds.includes(s.id));
      const newAlumni = graduating.map(s => ({
        nis: s.nis,
        name: s.name,
        class: s.class,
        graduationYear: activeYear?.year || '2025/2026',
        nextSchool: '',
      }));
      // Bulk create via API
      try {
        await api.bulkCreateAlumni(newAlumni);
        // Refresh alumni from API
        const refreshed = await api.getAlumni();
        setAlumni(refreshed);
      } catch {
        newAlumni.forEach(a => addAlumni(a));
      }
      // Mark students as inactive
      graduating.forEach(s => updateStudent(s.id, { status: 'inactive' }));
      setSuccessMsg(`${graduating.length} siswa kelas ${sourceClass.name} telah diluluskan dan dipindahkan ke data alumni.`);
    } else {
      if (!targetClassId) {
        alert('Pilih kelas tujuan.');
        return;
      }
      const target = targetClasses.find(c => c.id === Number(targetClassId));
      if (!target) {
        alert('Kelas tujuan tidak valid.');
        return;
      }
      const promoting = students.filter(s => selectedIds.includes(s.id));
      promoting.forEach(s => updateStudent(s.id, { class: target.name }));
      setSuccessMsg(`${promoting.length} siswa berhasil dinaikkan dari ${sourceClass.name} ke ${target.name}.`);
    }

    setSelectedIds([]);
    setTimeout(() => setSuccessMsg(''), 5000);
  };

  // Get the label for the current academic year
  const currentYearLabel = useMemo(() => {
    if (!selectedAcademicYearId || academicYears.length === 0) return '';
    const y = academicYears.find(y => y.id === selectedAcademicYearId);
    return y ? y.year : '';
  }, [selectedAcademicYearId, academicYears]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-warm-200 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-primary-800 flex items-center gap-2 mb-1">
          <ArrowUpCircle size={20} className="text-primary-600" />
          Kenaikan Kelas
        </h2>
        <p className="text-sm text-gray-500">Pilih grade, lalu kelas asal, pilih siswa, lalu naikkan atau luluskan.</p>
      </div>

      {/* Success message */}
      {successMsg && (
        <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl">
          <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
          <p className="text-sm font-medium">{successMsg}</p>
        </div>
      )}

      {/* Controls — Cascading Filter */}
      <div className="bg-white rounded-xl border border-warm-200 shadow-sm p-5">

        {/* Step indicators */}
        <div className="flex items-center gap-2 mb-4">
          <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${selectedGrade ? 'bg-primary-600 text-white' : 'bg-warm-200 text-gray-500'}`}>1</span>
          <span className="text-xs font-medium text-gray-500">Pilih Grade</span>
          <ChevronRight size={14} className="text-warm-300" />
          <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${sourceClassId ? 'bg-primary-600 text-white' : 'bg-warm-200 text-gray-500'}`}>2</span>
          <span className="text-xs font-medium text-gray-500">Pilih Kelas</span>
          <ChevronRight size={14} className="text-warm-300" />
          <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${sourceClass && !isGradeNine ? (targetClassId ? 'bg-primary-600 text-white' : 'bg-warm-200 text-gray-500') : (sourceClass && isGradeNine ? 'bg-gold-500 text-white' : 'bg-warm-200 text-gray-500')}`}>3</span>
          <span className="text-xs font-medium text-gray-500">{isGradeNine ? 'Luluskan' : 'Naik ke Kelas'}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">

          {/* Step 1: Pilih Grade */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Grade {currentYearLabel && <span className="text-gray-400 font-normal">({currentYearLabel})</span>}
            </label>
            <select
              value={selectedGrade}
              onChange={e => handleGradeChange(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-warm-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 bg-white"
            >
              <option value="">-- Pilih Grade --</option>
              {availableGrades.map(level => (
                <option key={level} value={level}>Grade {level}</option>
              ))}
            </select>
          </div>

          {/* Step 2: Pilih Kelas Asal */}
          <div>
            <label className={`flex items-center gap-1 text-sm font-medium mb-1 ${selectedGrade ? 'text-gray-700' : 'text-gray-400'}`}>
              Kelas Asal
              {selectedGrade && <span className="text-gray-400 font-normal"> (Grade {selectedGrade})</span>}
              {selectedGrade && filteredSourceClasses.length === 0 && (
                <WarningTooltip msg={`Tidak ada kelas di Grade ${selectedGrade} pada tahun ajaran ini.`} />
              )}
            </label>
            <select
              value={sourceClassId}
              onChange={e => handleSourceClassChange(e.target.value)}
              disabled={!selectedGrade}
              className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 transition-colors ${
                selectedGrade
                  ? 'border-warm-200 bg-white text-gray-800 cursor-pointer'
                  : 'border-warm-100 bg-warm-50 text-gray-400 cursor-not-allowed'
              }`}
            >
              <option value="">-- Pilih Kelas --</option>
              {filteredSourceClasses.map(c => (
                <option key={c.id} value={c.id}>Kelas {c.name}</option>
              ))}
            </select>
          </div>

          {/* Step 3a: Naik ke Kelas (non-grade 9) */}
          {!isGradeNine && sourceClass && (
            <div>
              <label className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-1">
                Naik ke Kelas
                {nextAcademicYear
                  ? <span className="text-gray-400 font-normal"> ({nextAcademicYear.year})</span>
                  : <span className="text-gray-400 font-normal"> (tahun berikutnya)</span>
                }
                {!nextAcademicYear && (
                  <WarningTooltip msg="Tahun pelajaran berikutnya belum tersedia. Silakan buat tahun ajaran baru terlebih dahulu." />
                )}
                {nextAcademicYear && targetClasses.length === 0 && (
                  <WarningTooltip msg={`Tidak ada kelas Grade ${sourceClass.level + 1} di tahun ajaran ${nextAcademicYear.year}.`} />
                )}
              </label>
              <select
                value={targetClassId}
                onChange={e => setTargetClassId(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-warm-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 bg-white"
              >
                <option value="">-- Pilih Kelas Tujuan --</option>
                {targetClasses.map(c => (
                  <option key={c.id} value={c.id}>Kelas {c.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Step 3b: Spacer when grade 9 (no target class dropdown needed) */}
          {isGradeNine && sourceClass && <div />}

          {/* Action button */}
          {sourceClass && (
            <div>
              {isGradeNine ? (
                <button
                  onClick={handlePromote}
                  className="px-4 py-2 text-sm font-medium text-white bg-gold-500 hover:bg-gold-400 rounded-lg transition-all duration-200 flex items-center gap-2 w-full justify-center"
                >
                  <GraduationCap size={16} /> Luluskan ({selectedIds.length})
                </button>
              ) : (
                <button
                  onClick={handlePromote}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-all duration-200 flex items-center gap-2 w-full justify-center"
                >
                  <ArrowUpCircle size={16} /> Naikkan ({selectedIds.length})
                </button>
              )}
            </div>
          )}
        </div>

        {isGradeNine && sourceClass && (
          <div className="flex items-center gap-2 mt-3 px-3 py-2 bg-gold-50 border border-gold-200 rounded-lg">
            <AlertTriangle size={16} className="text-gold-500 shrink-0" />
            <p className="text-xs text-gold-700">Siswa kelas 9 akan diluluskan dan dipindahkan ke data alumni.</p>
          </div>
        )}
      </div>

      {/* Student list */}
      {sourceClass && (
        <div className="bg-white rounded-xl border border-warm-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-warm-200 flex items-center justify-between">
            <h3 className="text-base font-semibold text-primary-800">
              Siswa Kelas {sourceClass.name} ({classStudents.length} siswa)
            </h3>
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedIds.length === classStudents.length && classStudents.length > 0}
                onChange={e => toggleAll(e.target.checked)}
                className="rounded border-warm-300 text-primary-600 focus:ring-primary-500"
              />
              Pilih Semua
            </label>
          </div>

          {classStudents.length === 0 ? (
            <div className="px-5 py-12 text-center text-gray-400 text-sm">Tidak ada siswa aktif di kelas ini.</div>
          ) : (
            <div className="divide-y divide-warm-100">
              {classStudents.map(student => (
                <label
                  key={student.id}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-warm-50/50 cursor-pointer transition-colors duration-150"
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(student.id)}
                    onChange={() => toggleOne(student.id)}
                    className="rounded border-warm-300 text-primary-600 focus:ring-primary-500"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{student.name}</p>
                    <p className="text-xs text-gray-400">NISN: {student.nis}</p>
                  </div>
                  <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${student.gender === 'L' ? 'bg-blue-50 text-blue-700' : 'bg-pink-50 text-pink-700'}`}>
                    {student.gender === 'L' ? 'Laki-laki' : 'Perempuan'}
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
