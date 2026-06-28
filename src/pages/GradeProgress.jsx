import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import api from '../services/api';
import { BarChart3, ChevronDown, Users, BookOpen } from 'lucide-react';

const GRADE_OPTIONS = [7, 8, 9];

// Animated progress bar component
function ProgressBar({ percent, color = 'primary' }) {
  const colorMap = {
    primary: 'bg-primary-500',
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-400',
    red: 'bg-red-400',
  };

  const barColor = percent >= 75 ? 'bg-emerald-500' : percent >= 50 ? 'bg-primary-500' : percent >= 25 ? 'bg-amber-400' : 'bg-red-400';
  const textColor = percent >= 75 ? 'text-emerald-600' : percent >= 50 ? 'text-primary-600' : percent >= 25 ? 'text-amber-600' : 'text-red-500';

  return (
    <div className="flex items-center gap-3 w-full">
      <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${barColor} transition-all duration-700 ease-out`}
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className={`text-sm font-bold tabular-nums w-12 text-right ${textColor}`}>{percent}%</span>
    </div>
  );
}

export default function GradeProgress() {
  const { academicYears, selectedAcademicYearId, getSemesterLabel } = useApp();
  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [data, setData] = useState({ classes: [], year: '' });
  const [loading, setLoading] = useState(false);

  const activeYear = academicYears.find(y => y.id === selectedAcademicYearId) || academicYears.find(y => y.isActive);
  const availableClasses = data.classes
    .filter(c => !selectedGrade || c.level === Number(selectedGrade))
    .map(c => c.className);

  // Fetch data when filters change
  useEffect(() => {
    if (!selectedAcademicYearId) return;
    setLoading(true);
    const params = { academicYearId: selectedAcademicYearId };
    if (selectedGrade) params.level = selectedGrade;
    if (selectedClass) params.className = selectedClass;

    api.getGradeProgress(params)
      .then(d => setData(d))
      .catch(() => setData({ classes: [], year: '' }))
      .finally(() => setLoading(false));
  }, [selectedAcademicYearId, selectedGrade, selectedClass]);

  // Reset class when grade changes
  const handleGradeChange = (grade) => {
    setSelectedGrade(grade);
    setSelectedClass('');
  };

  const isSpecificClass = !!selectedClass;
  const filteredClasses = selectedClass
    ? data.classes.filter(c => c.className === selectedClass)
    : selectedGrade
      ? data.classes.filter(c => c.level === Number(selectedGrade))
      : data.classes;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-primary-50 text-primary-600">
          <BarChart3 size={22} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-primary-900">Progres Nilai</h1>
          <p className="text-sm text-gray-500">
            Pantau progres input nilai per kelas
            {activeYear && <span className="text-gray-400"> — {activeYear.year} · {getSemesterLabel(activeYear, activeYear.activeSemester)}</span>}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-warm-200 shadow-sm p-4">
        <div className="flex flex-col sm:flex-row sm:items-end gap-3">
          <div className="flex-1 max-w-[180px]">
            <label className="block text-xs font-medium text-gray-500 mb-1">Tingkat</label>
            <div className="relative">
              <select
                value={selectedGrade}
                onChange={e => handleGradeChange(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-warm-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 appearance-none bg-white pr-8"
              >
                <option value="">Semua Tingkat</option>
                {GRADE_OPTIONS.map(g => (
                  <option key={g} value={g}>Kelas {g}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>
          <div className="flex-1 max-w-[180px]">
            <label className="block text-xs font-medium text-gray-500 mb-1">Kelas</label>
            <div className="relative">
              <select
                value={selectedClass}
                onChange={e => setSelectedClass(e.target.value)}
                disabled={!selectedGrade}
                className="w-full px-3 py-2 text-sm border border-warm-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 appearance-none bg-white pr-8 disabled:opacity-50"
              >
                <option value="">Semua Kelas</option>
                {data.classes
                  .filter(c => !selectedGrade || c.level === Number(selectedGrade))
                  .map(c => (
                    <option key={c.className} value={c.className}>{c.className}</option>
                  ))
                }
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>
          {selectedClass && (
            <button
              onClick={() => setSelectedClass('')}
              className="px-3 py-2 text-xs font-medium text-gray-500 bg-warm-100 hover:bg-warm-200 rounded-lg transition-all duration-200"
            >
              Tampilkan Semua
            </button>
          )}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
        </div>
      )}

      {/* Content */}
      {!loading && filteredClasses.length === 0 && (
        <div className="bg-white rounded-xl border border-warm-200 shadow-sm p-12 text-center text-gray-400">
          <BarChart3 size={40} className="mx-auto mb-3 text-gray-200" />
          <p className="text-sm">Belum ada data progres untuk filter yang dipilih.</p>
        </div>
      )}

      {!loading && filteredClasses.length > 0 && !isSpecificClass && (
        /* ── All Classes View ── */
        <div className="bg-white rounded-xl border border-warm-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-warm-200">
            <h3 className="text-sm font-semibold text-gray-700">Progres Nilai Per Kelas</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-warm-50">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase w-10">No</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Kelas</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Wali Kelas</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase w-20">Siswa</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase min-w-[200px]">Progres</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-warm-100">
                {filteredClasses.map((cls, idx) => (
                  <tr key={cls.className} className="hover:bg-warm-50/50 transition-colors">
                    <td className="px-4 py-3 text-gray-400 text-xs">{idx + 1}</td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-primary-700">{cls.className}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-sm">{cls.homeroomTeacher}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center gap-1 text-sm text-gray-600">
                        <Users size={14} className="text-gray-400" />
                        {cls.totalStudents}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <ProgressBar percent={cls.progressPercent} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && filteredClasses.length > 0 && isSpecificClass && (
        /* ── Specific Class View ── */
        filteredClasses.map(cls => (
          <div key={cls.className} className="bg-white rounded-xl border border-warm-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-warm-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-700">Kelas {cls.className}</h3>
                <p className="text-xs text-gray-400">Wali Kelas: {cls.homeroomTeacher} · {cls.totalStudents} siswa</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-bold ${cls.progressPercent >= 75 ? 'text-emerald-600' : cls.progressPercent >= 50 ? 'text-primary-600' : cls.progressPercent >= 25 ? 'text-amber-600' : 'text-red-500'}`}>
                  {cls.progressPercent}%
                </span>
                <span className="text-xs text-gray-400">selesai</span>
              </div>
            </div>
            {/* Overall progress bar */}
            <div className="px-5 py-3 border-b border-warm-100 bg-warm-50/50">
              <ProgressBar percent={cls.progressPercent} />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-warm-50">
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase w-10">No</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Mata Pelajaran</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Guru</th>
                    <th className="px-4 py-2.5 text-center text-xs font-semibold text-gray-500 uppercase w-24">Terinput</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase min-w-[180px]">Progres</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-warm-100">
                  {cls.subjects.map((sub, idx) => (
                    <tr key={sub.subjectId} className="hover:bg-warm-50/50 transition-colors">
                      <td className="px-4 py-2.5 text-gray-400 text-xs">{idx + 1}</td>
                      <td className="px-4 py-2.5">
                        <span className="flex items-center gap-1.5 text-sm text-gray-700">
                          <BookOpen size={14} className="text-gray-400" />
                          {sub.subjectName}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-gray-600 text-xs">{sub.teacherName}</td>
                      <td className="px-4 py-2.5 text-center text-xs text-gray-600">
                        {sub.gradedStudents}/{sub.totalStudents}
                      </td>
                      <td className="px-4 py-2.5">
                        <ProgressBar percent={sub.progressPercent} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
