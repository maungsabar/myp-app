import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import api from '../services/api';
import { ArrowUpCircle, GraduationCap, CheckCircle2, AlertTriangle } from 'lucide-react';

const ALL_CLASSES = ['7A', '7B', '8A', '8B', '9A', '9B'];

const PROMOTION_MAP = {
  '7A': '8A', '7B': '8B',
  '8A': '9A', '8B': '9B',
  '9A': null, '9B': null, // graduates
};

export default function PromoteClass() {
  const { students, updateStudent, alumni, setAlumni, addAlumni, activeYear } = useApp();
  const [sourceClass, setSourceClass] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [targetClass, setTargetClass] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const classStudents = useMemo(
    () => students.filter(s => s.class === sourceClass && s.status === 'active'),
    [students, sourceClass]
  );

  const isGradeNine = sourceClass.startsWith('9');
  const nextClass = PROMOTION_MAP[sourceClass] || '';

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
      setSuccessMsg(`${graduating.length} siswa kelas ${sourceClass} telah diluluskan dan dipindahkan ke data alumni.`);
    } else {
      if (!targetClass) {
        alert('Pilih kelas tujuan.');
        return;
      }
      const promoting = students.filter(s => selectedIds.includes(s.id));
      promoting.forEach(s => updateStudent(s.id, { class: targetClass }));
      setSuccessMsg(`${promoting.length} siswa berhasil dinaikkan dari ${sourceClass} ke ${targetClass}.`);
    }

    setSelectedIds([]);
    setTimeout(() => setSuccessMsg(''), 5000);
  };

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
            <label className="block text-sm font-medium text-gray-700 mb-1">Kelas Asal</label>
            <select
              value={sourceClass}
              onChange={e => { setSourceClass(e.target.value); setSelectedIds([]); setTargetClass(''); }}
              className="w-full px-3 py-2 text-sm border border-warm-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400"
            >
              <option value="">-- Pilih Kelas --</option>
              {ALL_CLASSES.map(c => <option key={c} value={c}>Kelas {c}</option>)}
            </select>
          </div>

          {!isGradeNine && sourceClass && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Naikkan ke Kelas</label>
              <select
                value={targetClass}
                onChange={e => setTargetClass(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-warm-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400"
              >
                <option value="">-- Pilih Kelas Tujuan --</option>
                {ALL_CLASSES.filter(c => c !== sourceClass).map(c => <option key={c} value={c}>Kelas {c}</option>)}
              </select>
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
              Siswa Kelas {sourceClass} ({classStudents.length} siswa)
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
