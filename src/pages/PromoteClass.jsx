import { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import api from '../services/api';
import { ArrowUpCircle, GraduationCap, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function PromoteClass() {
  const { students, updateStudent, alumni, setAlumni, addAlumni, activeYear, academicYears, classes, selectedAcademicYearId } = useApp();
  const [sourceClassId, setSourceClassId] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [targetClassId, setTargetClassId] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [targetClasses, setTargetClasses] = useState([]);

  // Classes for the currently selected academic year (Kelas Asal)
  const sourceClasses = useMemo(() => {
    if (!selectedAcademicYearId) return [];
    return classes
      .filter(c => c.academicYearId === selectedAcademicYearId)
      .sort((a, b) => a.level - b.level || a.name.localeCompare(b.name));
  }, [classes, selectedAcademicYearId]);

  // The selected source class object
  const sourceClass = useMemo(() => {
    if (!sourceClassId) return null;
    return sourceClasses.find(c => c.id === Number(sourceClassId)) || null;
  }, [sourceClasses, sourceClassId]);

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
        <p className="text-sm text-gray-500">Pilih kelas asal, pilih siswa, lalu naikkan atau luluskan.</p>
      </div>

      {/* Success message */}
      {successMsg && (
        <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl">
          <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
          <p className="text-sm font-medium">{successMsg}</p>
        </div>
      )}

      {/* Controls */}
      <div className="bg-white rounded-xl border border-warm-200 shadow-sm p-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Kelas Asal {currentYearLabel && `(${currentYearLabel})`}</label>
            <select
              value={sourceClassId}
              onChange={e => { setSourceClassId(e.target.value); setSelectedIds([]); setTargetClassId(''); }}
              className="w-full px-3 py-2 text-sm border border-warm-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400"
            >
              <option value="">-- Pilih Kelas --</option>
              {sourceClasses.map(c => <option key={c.id} value={c.id}>Kelas {c.name}</option>)}
            </select>
          </div>

          {!isGradeNine && sourceClass && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Naikkan ke Kelas {nextAcademicYear ? `(${nextAcademicYear.year})` : ''}
              </label>
              <select
                value={targetClassId}
                onChange={e => setTargetClassId(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-warm-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400"
              >
                <option value="">-- Pilih Kelas Tujuan --</option>
                {targetClasses.map(c => <option key={c.id} value={c.id}>Kelas {c.name}</option>)}
              </select>
              {!nextAcademicYear && (
                <p className="text-xs text-amber-600 mt-1">Tahun pelajaran berikutnya belum tersedia. Buat terlebih dahulu.</p>
              )}
              {nextAcademicYear && targetClasses.length === 0 && (
                <p className="text-xs text-amber-600 mt-1">Tidak ada kelas grade {sourceClass.level + 1} di tahun pelajaran {nextAcademicYear.year}.</p>
              )}
            </div>
          )}

          {sourceClass && (
            <div>
              {isGradeNine ? (
                <button onClick={handlePromote} className="px-4 py-2 text-sm font-medium text-white bg-gold-500 hover:bg-gold-400 rounded-lg transition-all duration-200 flex items-center gap-2 w-full justify-center">
                  <GraduationCap size={16} /> Luluskan ({selectedIds.length})
                </button>
              ) : (
                <button onClick={handlePromote} className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-all duration-200 flex items-center gap-2 w-full justify-center">
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
