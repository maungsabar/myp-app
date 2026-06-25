import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import api from '../services/api';
import {
  GraduationCap, BookOpen, CalendarDays, School,
  UserCheck, UserX, TrendingUp, FileText, ClipboardList,
} from 'lucide-react';

export default function TeacherDashboard() {
  const {
    students, subjects, grades, attendances, schoolProfile,
    activeYear, currentUser, getSemesterLabel, calculateGradeDynamic,
  } = useApp();

  const [myTeacher, setMyTeacher] = useState(null);
  const [myAssignments, setMyAssignments] = useState([]);

  // Fetch teacher record and teaching assignments
  useEffect(() => {
    if (currentUser?.role === 'homeroom' || currentUser?.role === 'subject') {
      api.getMyTeacher()
        .then(t => setMyTeacher(t))
        .catch(() => {});
    }
  }, [currentUser?.role, currentUser?.name]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch teaching assignments for all classes
  useEffect(() => {
    if (!myTeacher) return;
    api.getTeachingAssignments()
      .then(data => {
        const mine = data.filter(a => a.teacher?.name === currentUser?.name);
        setMyAssignments(mine);
      })
      .catch(() => {});
  }, [myTeacher, currentUser?.name]);

  const activeYearStr = activeYear?.year || '-';
  const semesterLabel = getSemesterLabel(activeYear, activeYear?.activeSemester || 1);

  // Determine classes this teacher is involved with
  const myClasses = useMemo(() => {
    if (!myTeacher) return [];
    const classSet = new Set();
    if (currentUser?.role === 'homeroom' && myTeacher.homeroom) {
      classSet.add(myTeacher.homeroom);
    }
    myAssignments.forEach(a => classSet.add(a.className));
    return Array.from(classSet).sort();
  }, [myTeacher, myAssignments, currentUser?.role]);

  // Students in my classes
  const myStudents = useMemo(() => {
    if (myClasses.length === 0) return [];
    return students
      .filter(s => myClasses.includes(s.class) && s.status === 'active')
      .sort((a, b) => a.class.localeCompare(b.class) || a.name.localeCompare(b.name));
  }, [students, myClasses]);

  // Grade stats for my students
  const gradeStats = useMemo(() => {
    if (myStudents.length === 0 || grades.length === 0) return { graded: 0, avg: 0 };
    const myStudentIds = new Set(myStudents.map(s => s.id));
    const myGrades = grades.filter(g =>
      myStudentIds.has(g.studentId) &&
      g.academicYear === activeYearStr &&
      g.semester === (activeYear?.activeSemester || 1)
    );
    const graded = myGrades.length;
    if (graded === 0) return { graded: 0, avg: 0 };
    const totalGrades = myGrades.reduce((sum, g) => {
      const total = (g.scoreA || 0) + (g.scoreB || 0) + (g.scoreC || 0) + (g.scoreD || 0);
      const grade = calculateGradeDynamic(total, 4) || 0;
      return sum + grade;
    }, 0);
    return { graded, avg: (totalGrades / graded).toFixed(1) };
  }, [myStudents, grades, activeYearStr, activeYear]); // eslint-disable-line react-hooks/exhaustive-deps

  // Attendance stats for my students
  const attendanceStats = useMemo(() => {
    if (myStudents.length === 0 || attendances.length === 0) return { present: 0, absent: 0 };
    const myStudentIds = new Set(myStudents.map(s => s.id));
    const myAtt = attendances.filter(a =>
      myStudentIds.has(a.studentId) &&
      a.academicYear === activeYearStr &&
      a.semester === (activeYear?.activeSemester || 1)
    );
    const totalPresent = myAtt.reduce((s, a) => s + (a.present || 0), 0);
    const totalAbsent = myAtt.reduce((s, a) => s + (a.unexcused || 0) + (a.sick || 0) + (a.excused || 0), 0);
    return { present: totalPresent, absent: totalAbsent };
  }, [myStudents, attendances, activeYearStr, activeYear]); // eslint-disable-line react-hooks/exhaustive-deps

  const roleLabel = currentUser?.role === 'homeroom' ? 'Wali Kelas' : 'Guru Mata Pelajaran';
  const homeroomLabel = myTeacher?.homeroom ? `Kelas ${myTeacher.homeroom}` : '';

  const statCards = [
    { label: 'Kelas', value: myClasses.length, icon: BookOpen, color: 'border-l-primary-600', iconBg: 'bg-primary-50 text-primary-600' },
    { label: 'Total Siswa', value: myStudents.length, icon: GraduationCap, color: 'border-l-emerald-500', iconBg: 'bg-emerald-50 text-emerald-600' },
    { label: 'Nilai Terinput', value: gradeStats.graded, icon: ClipboardList, color: 'border-l-gold-500', iconBg: 'bg-gold-50 text-gold-600' },
    { label: 'Rata-rata MYP', value: gradeStats.avg, icon: TrendingUp, color: 'border-l-violet-500', iconBg: 'bg-violet-50 text-violet-600' },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary-700 via-primary-600 to-primary-800 rounded-2xl p-6 md:p-8 text-white shadow-lg">
        <div className="absolute inset-0 opacity-5">
          <svg width="100%" height="100%"><defs><pattern id="tgrid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" /></pattern></defs><rect width="100%" height="100%" fill="url(#tgrid)" /></svg>
        </div>
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <School size={18} className="text-gold-400" />
                <span className={`text-sm font-medium text-primary-200 transition-opacity duration-300 ${!schoolProfile?.name ? 'opacity-0' : 'opacity-100'}`}>{schoolProfile?.name || ''}</span>
              </div>
              <h1 className={`text-2xl md:text-3xl font-bold tracking-tight transition-opacity duration-300 ${!currentUser?.name ? 'opacity-0' : 'opacity-100'}`}>
                Selamat Datang, {currentUser?.name?.split(',')[0] || ''}
              </h1>
              <p className="mt-1 text-primary-200 text-sm md:text-base">
                {roleLabel} {homeroomLabel && `— ${homeroomLabel}`}
              </p>
            </div>
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3">
              <CalendarDays size={20} className="text-gold-400" />
              <div>
                <p className={`text-sm font-semibold transition-opacity duration-300 ${activeYearStr === '-' ? 'opacity-0' : 'opacity-100'}`}>Tahun Ajaran {activeYearStr}</p>
                <p className={`text-xs text-primary-200 transition-opacity duration-300 ${!semesterLabel ? 'opacity-0' : 'opacity-100'}`}>{semesterLabel}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(card => (
          <div key={card.label} className={`bg-white rounded-xl border border-warm-200 shadow-sm p-4 border-l-4 ${card.color}`}>
            <div className="flex items-center justify-between mb-2">
              <div className={`p-2 rounded-lg ${card.iconBg}`}>
                <card.icon size={18} />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-800">{card.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Attendance Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-warm-200 shadow-sm p-5">
          <h3 className="text-base font-semibold text-primary-800 mb-4 flex items-center gap-2">
            <UserCheck size={18} className="text-primary-600" />
            Ringkasan Kehadiran
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-emerald-50 rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-emerald-700">{attendanceStats.present}</p>
              <p className="text-xs text-emerald-600 mt-1">Total Hadir</p>
            </div>
            <div className="bg-red-50 rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-red-600">{attendanceStats.absent}</p>
              <p className="text-xs text-red-500 mt-1">Total Tidak Hadir</p>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="bg-white rounded-xl border border-warm-200 shadow-sm p-5">
          <h3 className="text-base font-semibold text-primary-800 mb-4 flex items-center gap-2">
            <FileText size={18} className="text-primary-600" />
            Akses Cepat
          </h3>
          <div className="space-y-2">
            <Link to="/akademik/nilai" className="flex items-center gap-3 p-3 rounded-lg border border-warm-100 hover:border-primary-300 hover:bg-primary-50/50 transition-all duration-200">
              <div className="p-2 rounded-lg bg-primary-50"><ClipboardList size={16} className="text-primary-600" /></div>
              <div>
                <p className="text-sm font-medium text-gray-700">Input Nilai</p>
                <p className="text-xs text-gray-400">Kelola nilai siswa per mata pelajaran</p>
              </div>
            </Link>
            {currentUser?.role === 'homeroom' && (
              <>
                <Link to="/akademik/kehadiran" className="flex items-center gap-3 p-3 rounded-lg border border-warm-100 hover:border-primary-300 hover:bg-primary-50/50 transition-all duration-200">
                  <div className="p-2 rounded-lg bg-emerald-50"><UserCheck size={16} className="text-emerald-600" /></div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Kehadiran & Catatan</p>
                    <p className="text-xs text-gray-400">Kelola kehadiran dan komentar wali kelas</p>
                  </div>
                </Link>
                <Link to="/laporan/rapor" className="flex items-center gap-3 p-3 rounded-lg border border-warm-100 hover:border-primary-300 hover:bg-primary-50/50 transition-all duration-200">
                  <div className="p-2 rounded-lg bg-gold-50"><FileText size={16} className="text-gold-600" /></div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Cetak Rapor</p>
                    <p className="text-xs text-gray-400">Preview dan cetak rapor siswa</p>
                  </div>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Student List */}
      {myStudents.length > 0 && (
        <div className="bg-white rounded-xl border border-warm-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-warm-200">
            <h3 className="text-base font-semibold text-primary-800 flex items-center gap-2">
              <GraduationCap size={18} className="text-primary-600" />
              Daftar Siswa
              <span className="text-sm font-normal text-gray-400">({myStudents.length} siswa{myClasses.length > 1 ? ` dari ${myClasses.length} kelas` : ''})</span>
            </h3>
          </div>
          <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-warm-50 z-10">
                <tr>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase w-10">No</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Nama</th>
                  <th className="px-4 py-2.5 text-center text-xs font-semibold text-gray-500 uppercase w-20">Kelas</th>
                  <th className="px-4 py-2.5 text-center text-xs font-semibold text-gray-500 uppercase w-20">Gender</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-warm-100">
                {myStudents.map((student, idx) => (
                  <tr key={student.id} className="hover:bg-warm-50/50 transition-colors">
                    <td className="px-4 py-2 text-gray-400 text-xs">{idx + 1}</td>
                    <td className="px-4 py-2">
                      <p className="font-medium text-gray-800">{student.name}</p>
                      <p className="text-[11px] text-gray-400">NISN: {student.nis}</p>
                    </td>
                    <td className="px-4 py-2 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-primary-50 text-primary-700">{student.class}</span>
                    </td>
                    <td className="px-4 py-2 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${student.gender === 'L' ? 'bg-blue-50 text-blue-700' : 'bg-pink-50 text-pink-700'}`}>
                        {student.gender === 'L' ? 'Laki-laki' : 'Perempuan'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {myStudents.length === 0 && myTeacher && (
        <div className="bg-white rounded-xl border border-warm-200 shadow-sm p-12 text-center">
          <GraduationCap size={40} className="mx-auto mb-3 text-gray-200" />
          <p className="text-gray-400 text-sm">Belum ada siswa yang terhubung dengan kelas Anda.</p>
        </div>
      )}
    </div>
  );
}
