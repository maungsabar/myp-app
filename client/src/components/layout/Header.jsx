import { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Bell, Clock, User, Menu, LogOut, ChevronDown, KeyRound } from 'lucide-react';

const ROLE_LABELS = {
  admin: 'Administrator',
  coordinator: 'Koordinator MYP',
  homeroom: 'Wali Kelas',
  subject: 'Guru Mapel',
  student: 'Siswa',
};

export default function Header({ onMenuToggle }) {
  const { schoolProfile, activeYear, academicYears, getSemesterLabel, currentUser, logout, selectedAcademicYearId, setSelectedAcademicYearId } = useApp();
  const [showDropdown, setShowDropdown] = useState(false);
  const [time, setTime] = useState(new Date());
  const dropdownRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date) => {
    return date.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-warm-200 px-4 sm:px-6 h-[52px] flex items-center justify-between">
      <div className="flex items-center gap-3 flex-1">
        <button onClick={onMenuToggle}
          className="p-2 text-gray-500 hover:text-primary-600 hover:bg-warm-100 rounded-lg transition-all duration-200">
          <Menu size={20} />
        </button>
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-warm-50 border border-warm-200 rounded-lg text-xs text-gray-600 font-medium select-none">
          <Clock size={14} className="text-primary-600 animate-pulse" />
          <span>{formatDate(time)}</span>
          <span className="text-warm-300">•</span>
          <span className="font-mono font-semibold text-primary-700">{formatTime(time)}</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Academic year filter — admin only */}
        {currentUser?.role === 'admin' && academicYears?.length > 0 && (
          <div className="relative hidden sm:block">
            <select
              value={selectedAcademicYearId || ''}
              onChange={e => setSelectedAcademicYearId(Number(e.target.value))}
              className="text-xs font-medium text-gray-600 bg-warm-100 border border-warm-200 rounded-lg px-2.5 py-1.5 pr-7 focus:outline-none focus:ring-2 focus:ring-primary-400 appearance-none"
            >
              {academicYears.map(ay => (
                <option key={ay.id} value={ay.id}>
                  {ay.year} {ay.isActive ? '(Aktif)' : ''}
                </option>
              ))}
            </select>
            <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        )}
        {/* Non-admin: show active year as text */}
        {currentUser?.role !== 'admin' && (
          <span className={`text-xs text-gray-400 font-medium hidden sm:inline transition-opacity duration-300 ${!activeYear?.year ? 'opacity-0' : 'opacity-100'}`}>
            {activeYear?.year || ''} · {getSemesterLabel(activeYear, activeYear?.activeSemester || 2)}
          </span>
        )}
        <div className="w-px h-6 bg-warm-200 hidden sm:block" />

        {/* User dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-lg hover:bg-warm-100 transition-all duration-200"
          >
            <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center">
              <User size={16} className="text-primary-600" />
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-semibold text-primary-800 leading-tight truncate max-w-[140px]">{currentUser?.name || 'User'}</p>
              <p className="text-[11px] text-gray-400 leading-tight">{ROLE_LABELS[currentUser?.role] || currentUser?.role}</p>
            </div>
            <ChevronDown size={14} className="text-gray-400 hidden md:block" />
          </button>

          {showDropdown && (
            <div className="absolute right-0 top-full mt-1 w-56 bg-white rounded-xl border border-warm-200 shadow-lg py-1 animate-fade-in z-50">
              <div className="px-4 py-2.5 border-b border-warm-100">
                <p className="text-sm font-semibold text-gray-800 truncate">{currentUser?.name}</p>
                <p className="text-xs text-gray-400 truncate">{currentUser?.email || currentUser?.username}</p>
              </div>
              <button
                onClick={() => { setShowDropdown(false); logout(); }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors duration-150"
              >
                <LogOut size={16} />
                Keluar
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
