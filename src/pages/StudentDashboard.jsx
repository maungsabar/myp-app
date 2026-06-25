import { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  GraduationCap, BookOpen, TrendingUp, UserCheck, UserX, CalendarDays, School,
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie,
} from 'recharts';

const gradeColors = {
  1: '#ef4444', 2: '#ef4444', 3: '#f97316', 4: '#eab308',
  5: '#f59e0b', 6: '#10b981', 7: '#0d9488',
};

const gradeBgColors = {
  1: 'bg-red-100 text-red-700', 2: 'bg-red-100 text-red-700', 3: 'bg-orange-100 text-orange-700',
  4: 'bg-yellow-100 text-yellow-800', 5: 'bg-amber-100 text-amber-700',
  6: 'bg-emerald-100 text-emerald-700', 7: 'bg-teal-100 text-teal-800',
};

// Custom tooltip for subject bar chart
function SubjectTooltip({ active, payload }) {
  if (!active || !payload?.[0]) return null;
  const d = payload[0].payload;
  const colorCls = gradeBgColors[d.grade] || 'bg-gray-100 text-gray-600';
  return (
    <div className="bg-white rounded-lg shadow-lg border border-warm-200 p-3 min-w-[180px]">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-gray-800">{d.name}</span>
        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${colorCls}`}>
          {d.grade}
        </span>
      </div>
      <div className="flex items-center justify-between text-xs text-gray-500 border-t border-warm-100 pt-2">
        <span>Total Skor</span>
        <span className="font-semibold text-gray-800">{d.total} / {d.maxScore}</span>
      </div>
    </div>
  );
}

// Animated donut chart with interactive segments and legend
function DonutChart({ data, attendancePercent }) {
  const [activeIndex, setActiveIndex] = useState(-1);

  return (
    <div className="flex items-center gap-6">
      <div className="relative" style={{ width: '50%', height: 200 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={45}
              outerRadius={75}
              dataKey="value"
              stroke="none"
              animationBegin={0}
              animationDuration={1000}
              animationEasing="ease-out"
              onMouseEnter={(_, idx) => setActiveIndex(idx)}
              onMouseLeave={() => setActiveIndex(-1)}
            >
              {data.map((entry, idx) => (
                <Cell
                  key={idx}
                  fill={entry.color}
                  style={{
                    transform: activeIndex === idx ? 'scale(1.08)' : 'scale(1)',
                    transformOrigin: 'center',
                    transition: 'transform 0.3s ease-out',
                    filter: activeIndex >= 0 && activeIndex !== idx ? 'opacity(0.5)' : 'none',
                    cursor: 'pointer',
                  }}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        {/* Center label */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <p className="text-lg font-bold text-gray-800">{attendancePercent}%</p>
            <p className="text-[10px] text-gray-400">Hadir</p>
          </div>
        </div>
      </div>
      <div className="flex-1 space-y-2">
        {data.map((d, idx) => (
          <div
            key={d.name}
            className={`flex items-center gap-2 px-2 py-1.5 rounded-lg transition-all duration-200 cursor-default ${
              activeIndex === idx ? 'bg-warm-50 shadow-sm' : ''
            }`}
            onMouseEnter={() => setActiveIndex(idx)}
            onMouseLeave={() => setActiveIndex(-1)}
          >
            <span
              className={`w-3 h-3 rounded-full shrink-0 transition-transform duration-200 ${activeIndex === idx ? 'scale-125' : ''}`}
              style={{ backgroundColor: d.color }}
            />
            <span className="text-xs text-gray-600 flex-1">{d.name}</span>
            <span className="text-xs font-semibold text-gray-800">{d.value} hari</span>
          </div>
        ))}
        <div className="pt-2 mt-1 border-t border-warm-100">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 flex-1">Persentase Hadir</span>
            <span className="text-sm font-bold text-emerald-600">{attendancePercent}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function StudentDashboard() {
  const {
    students, subjects, grades, attendances, academicYears,
    activeYear, currentUser, calculateGradeDynamic, getCriteriaKeys, getCriteriaCount,
    getSemesterLabel,
  } = useApp();

  // Find current student record
  const myStudent = useMemo(
    () => students.find(s => s.name === currentUser?.name),
    [students, currentUser]
  );

  const activeYearStr = activeYear?.year || '-';
  const activeSemester = activeYear?.activeSemester || 1;

  // ─── My grades for active semester ───────────────────────────────
  const myGrades = useMemo(() => {
    if (!myStudent) return [];
    return grades.filter(g =>
      g.studentId === myStudent.id &&
      g.academicYear === activeYearStr &&
      g.semester === activeSemester
    );
  }, [grades, myStudent, activeYearStr, activeSemester]);

  // ─── Calculate average MYP grade for active semester ────────────
  const avgGrade = useMemo(() => {
    if (myGrades.length === 0) return 0;
    const totalGrades = myGrades.map(g => {
      const subject = subjects.find(s => s.id === g.subjectId);
      const cc = getCriteriaCount(subject, myStudent ? parseInt(myStudent.class) : null);
      const keys = getCriteriaKeys(cc);
      const sum = keys.reduce((acc, k) => acc + (g[`score${k}`] || 0), 0);
      return calculateGradeDynamic(sum, cc) || 0;
    });
    return (totalGrades.reduce((a, b) => a + b, 0) / totalGrades.length).toFixed(1);
  }, [myGrades, subjects, myStudent, getCriteriaCount, getCriteriaKeys, calculateGradeDynamic]);

  // ─── Attendance for active semester ──────────────────────────────
  const myAttendance = useMemo(() => {
    if (!myStudent) return null;
    return attendances.find(a =>
      a.studentId === myStudent.id &&
      a.academicYear === activeYearStr &&
      a.semester === activeSemester
    );
  }, [attendances, myStudent, activeYearStr, activeSemester]);

  const attendancePercent = useMemo(() => {
    if (!myAttendance) return 0;
    const total = myAttendance.present + myAttendance.unexcused + myAttendance.sick + myAttendance.excused;
    if (total === 0) return 0;
    return Math.round((myAttendance.present / total) * 100);
  }, [myAttendance]);

  const totalAbsent = myAttendance
    ? myAttendance.unexcused + myAttendance.sick + myAttendance.excused
    : 0;

  // ─── Progress data across all semesters ──────────────────────────
  const progressData = useMemo(() => {
    if (!myStudent) return [];
    const myAllGrades = grades.filter(g => g.studentId === myStudent.id);

    // Group by academicYear + semester
    const grouped = {};
    myAllGrades.forEach(g => {
      const key = `${g.academicYear}|${g.semester}`;
      if (!grouped[key]) grouped[key] = [];
      const subject = subjects.find(s => s.id === g.subjectId);
      const cc = getCriteriaCount(subject, myStudent ? parseInt(myStudent.class) : null);
      const keys = getCriteriaKeys(cc);
      const sum = keys.reduce((acc, k) => acc + (g[`score${k}`] || 0), 0);
      const grade = calculateGradeDynamic(sum, cc) || 0;
      grouped[key].push(grade);
    });

    // Build chart data sorted by year+semester
    const entries = Object.entries(grouped).sort((a, b) => a[0].localeCompare(b[0]));
    return entries.map(([key, gradeList]) => {
      const [year, sem] = key.split('|');
      const semLabel = getSemesterLabel(
        academicYears.find(ay => ay.year === year),
        Number(sem)
      );
      const avg = gradeList.reduce((a, b) => a + b, 0) / gradeList.length;
      return {
        name: `${semLabel}\n${year}`,
        shortName: `S${sem} ${year?.slice(2)}`,
        avgGrade: Number(avg.toFixed(1)),
      };
    });
  }, [grades, myStudent, subjects, academicYears, getCriteriaCount, getCriteriaKeys, calculateGradeDynamic, getSemesterLabel]);

  // ─── Subject grades for current semester (bar chart) ────────────
  const subjectData = useMemo(() => {
    if (myGrades.length === 0) return [];
    return myGrades.map(g => {
      const subject = subjects.find(s => s.id === g.subjectId);
      const cc = getCriteriaCount(subject, myStudent ? parseInt(myStudent.class) : null);
      const keys = getCriteriaKeys(cc);
      const sum = keys.reduce((acc, k) => acc + (g[`score${k}`] || 0), 0);
      const grade = calculateGradeDynamic(sum, cc) || 0;
      return {
        name: subject?.shortName || `Subject ${g.subjectId}`,
        grade,
        total: sum,
        maxScore: cc * 8,
      };
    }).sort((a, b) => b.grade - a.grade);
  }, [myGrades, subjects, myStudent, getCriteriaCount, getCriteriaKeys, calculateGradeDynamic]);

  // ─── Attendance pie data ─────────────────────────────────────────
  const attendancePieData = useMemo(() => {
    if (!myAttendance) return [];
    return [
      { name: 'Hadir', value: myAttendance.present, color: '#10b981' },
      { name: 'Izin', value: myAttendance.excused, color: '#3b82f6' },
      { name: 'Sakit', value: myAttendance.sick, color: '#f59e0b' },
      { name: 'Tanpa Ket.', value: myAttendance.unexcused, color: '#ef4444' },
    ].filter(d => d.value > 0);
  }, [myAttendance]);

  const statCards = [
    { label: 'Rata-rata MYP', value: avgGrade, icon: TrendingUp, color: 'border-l-primary-600', iconBg: 'bg-primary-50 text-primary-600' },
    { label: 'Mata Pelajaran', value: myGrades.length, icon: BookOpen, color: 'border-l-emerald-500', iconBg: 'bg-emerald-50 text-emerald-600' },
    { label: 'Kehadiran', value: `${attendancePercent}%`, icon: UserCheck, color: 'border-l-blue-500', iconBg: 'bg-blue-50 text-blue-600' },
    { label: 'Tidak Hadir', value: totalAbsent, icon: UserX, color: 'border-l-red-400', iconBg: 'bg-red-50 text-red-500' },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary-700 via-primary-600 to-primary-800 rounded-2xl p-6 md:p-8 text-white shadow-lg">
        <div className="absolute inset-0 opacity-5">
          <svg width="100%" height="100%"><defs><pattern id="sgrid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" /></pattern></defs><rect width="100%" height="100%" fill="url(#sgrid)" /></svg>
        </div>
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <School size={18} className="text-gold-400" />
                <span className={`text-sm font-medium text-primary-200 transition-opacity duration-300 ${!myStudent?.class ? 'opacity-0' : 'opacity-100'}`}>{myStudent?.class || ''}</span>
              </div>
              <h1 className={`text-2xl md:text-3xl font-bold tracking-tight transition-opacity duration-300 ${!currentUser?.name ? 'opacity-0' : 'opacity-100'}`}>
                {currentUser?.name || ''}
              </h1>
              <p className={`mt-1 text-primary-200 text-sm transition-opacity duration-300 ${!myStudent?.nis ? 'opacity-0' : 'opacity-100'}`}>
                NISN: {myStudent?.nis || ''}
              </p>
            </div>
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3">
              <CalendarDays size={20} className="text-gold-400" />
              <div>
                <p className={`text-sm font-semibold transition-opacity duration-300 ${activeYearStr === '-' ? 'opacity-0' : 'opacity-100'}`}>Tahun Ajaran {activeYearStr}</p>
                <p className={`text-xs text-primary-200 transition-opacity duration-300 ${!activeYear?.year ? 'opacity-0' : 'opacity-100'}`}>{getSemesterLabel(activeYear, activeSemester)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(card => (
          <div key={card.label} className={`bg-white rounded-xl border border-warm-200 shadow-sm p-5 border-l-4 ${card.color} transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lg hover:border-l-[6px] group cursor-default`}>
            <div className="flex items-center gap-3 mb-3">
              <div className={`p-2.5 rounded-xl ${card.iconBg} transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
                <card.icon size={20} />
              </div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{card.label}</p>
            </div>
            <p className="text-3xl font-bold text-gray-800 tracking-tight">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Progress Line Chart */}
        <div className="bg-white rounded-xl border border-warm-200 shadow-sm p-5">
          <h3 className="text-base font-semibold text-primary-800 mb-4 flex items-center gap-2">
            <TrendingUp size={18} className="text-primary-600" />
            Perkembangan Rata-rata MYP Grade
          </h3>
          {progressData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={progressData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0ebe3" />
                <XAxis dataKey="shortName" tick={{ fontSize: 11, fill: '#6b7280' }} />
                <YAxis domain={[0, 7]} ticks={[0, 1, 2, 3, 4, 5, 6, 7]} tick={{ fontSize: 11, fill: '#6b7280' }} />
                <Tooltip
                  formatter={(val) => [`Grade ${val}`, 'Rata-rata MYP']}
                  contentStyle={{ borderRadius: 8, border: '1px solid #f0ebe3', fontSize: 12 }}
                />
                <Line
                  type="monotone"
                  dataKey="avgGrade"
                  stroke="#0f766e"
                  strokeWidth={2.5}
                  dot={{ fill: '#0f766e', r: 5, strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[220px] text-gray-400 text-sm">
              Belum ada data perkembangan.
            </div>
          )}
        </div>

        {/* Attendance Pie Chart */}
        <div className="bg-white rounded-xl border border-warm-200 shadow-sm p-5 group/donut">
          <h3 className="text-base font-semibold text-primary-800 mb-4 flex items-center gap-2">
            <UserCheck size={18} className="text-primary-600" />
            Ringkasan Kehadiran
          </h3>
          {attendancePieData.length > 0 ? (
            <DonutChart data={attendancePieData} attendancePercent={attendancePercent} />
          ) : (
            <div className="flex items-center justify-center h-[200px] text-gray-400 text-sm">
              Belum ada data kehadiran.
            </div>
          )}
        </div>
      </div>

      {/* Subject Bar Chart */}
      <div className="bg-white rounded-xl border border-warm-200 shadow-sm p-5">
        <h3 className="text-base font-semibold text-primary-800 mb-4 flex items-center gap-2">
          <GraduationCap size={18} className="text-primary-600" />
          Nilai Per Mata Pelajaran — {getSemesterLabel(activeYear, activeSemester)}
        </h3>
        {subjectData.length > 0 ? (
          <ResponsiveContainer width="100%" height={Math.max(200, subjectData.length * 40)}>
            <BarChart data={subjectData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0ebe3" horizontal={false} />
              <XAxis type="number" domain={[0, 7]} ticks={[0, 1, 2, 3, 4, 5, 6, 7]} tick={{ fontSize: 11, fill: '#6b7280' }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} width={120} />
              <Tooltip content={<SubjectTooltip />} cursor={{ fill: 'rgba(15, 118, 110, 0.04)' }} />
              <Bar dataKey="grade" radius={[0, 6, 6, 0]} barSize={26} animationDuration={800} animationEasing="ease-out">
                {subjectData.map((entry, idx) => (
                  <Cell
                    key={idx}
                    fill={gradeColors[entry.grade] || '#9ca3af'}
                    className="transition-opacity duration-200 hover:opacity-80"
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[200px] text-gray-400 text-sm">
            Belum ada nilai untuk semester ini.
          </div>
        )}
      </div>
    </div>
  );
}
