import { NavLink, useLocation } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  LayoutDashboard, Users, GraduationCap, BookOpen, FileText,
  ClipboardList, UserCheck, Printer, Settings, ChevronDown,
  School, Calendar, UserCog, Landmark, FileSpreadsheet,
  UserPlus, Archive, ScrollText, X, Layers, Award, BookOpenCheck, BarChart3
} from 'lucide-react';

const navGroups = [
  {
    label: 'Overview',
    items: [{ to: '/', icon: LayoutDashboard, label: 'Dashboard' }]
  },
  {
    label: 'Master Data',
    items: [
      {
        to: '/master/siswa', icon: Users, label: 'Siswa',
        children: [
          { to: '/master/siswa', label: 'Data Siswa', icon: ClipboardList },
          { to: '/master/siswa/naik-kelas', label: 'Naik Kelas', icon: UserPlus },
          { to: '/master/siswa/alumni', label: 'Alumni', icon: Archive },
        ]
      },
      {
        to: '/master/guru', icon: GraduationCap, label: 'Guru',
        children: [
          { to: '/master/guru', label: 'Data Guru', icon: GraduationCap },
          { to: '/master/guru/mengajar', label: 'Mengajar', icon: BookOpenCheck },
        ]
      },
      { to: '/master/kelas', icon: Layers, label: 'Data Kelas' },
      { to: '/master/mata-pelajaran', icon: BookOpen, label: 'Mata Pelajaran' },
      { to: '/master/deskriptor', icon: ScrollText, label: 'Setup Deskriptor' },
      { to: '/master/grade-boundaries', icon: ClipboardList, label: 'Grade Boundaries' },
    ]
  },
  {
    label: 'Akademik',
    items: [
      { to: '/akademik/nilai', icon: FileSpreadsheet, label: 'Input Nilai' },
      { to: '/akademik/kehadiran', icon: UserCheck, label: 'Kehadiran & Catatan' },
    ]
  },
  {
    label: 'Laporan',
    items: [
      { to: '/laporan/progres-nilai', icon: BarChart3, label: 'Progres Nilai' },
      { to: '/laporan/rapor', icon: Printer, label: 'Cetak Rapor' },
    ]
  },
  {
    label: 'Pengaturan',
    items: [
      { to: '/pengaturan/profil-sekolah', icon: School, label: 'Profil Sekolah' },
      { to: '/pengaturan/profil-pembelajar-ib', icon: Award, label: 'Profil Pembelajar IB' },
      { to: '/pengaturan/tahun-pelajaran', icon: Calendar, label: 'Tahun Pelajaran' },
      { to: '/pengaturan/kelola-user', icon: UserCog, label: 'Kelola User' },
    ]
  },
];

// Role-based navigation access
const ROLE_NAV = {
  admin: null, // null = access to everything
  coordinator: ['/', '/master/mata-pelajaran', '/master/deskriptor', '/master/grade-boundaries', '/laporan/progres-nilai', '/laporan/rapor'],
  homeroom: ['/', '/akademik/nilai', '/akademik/kehadiran', '/laporan/progres-nilai', '/laporan/rapor'],
  subject: ['/', '/akademik/nilai'],
  student: ['/', '/laporan/rapor'],
};

function filterNavGroups(groups, role) {
  const allowed = ROLE_NAV[role];
  if (!allowed) return groups; // admin sees all

  return groups.map(group => ({
    ...group,
    items: group.items
      .map(item => {
        if (item.children) {
          // Filter children
          const filteredChildren = item.children.filter(child =>
            allowed.some(path => child.to === path || child.to.startsWith(path + '/'))
          );
          if (filteredChildren.length === 0) return null;
          return { ...item, children: filteredChildren };
        }
        // Flat item
        const isAllowed = allowed.some(path => item.to === path || item.to.startsWith(path + '/'));
        return isAllowed ? item : null;
      })
      .filter(Boolean),
  })).filter(group => group.items.length > 0);
}

function NavItem({ item, onNavigate }) {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const hasChildren = item.children && item.children.length > 0;
  const isActive = hasChildren
    ? item.children.some(c => location.pathname === c.to)
    : location.pathname === item.to;

  // Auto-close submenu when navigating outside its children
  useEffect(() => {
    if (hasChildren) {
      const isChildActive = item.children.some(c => location.pathname === c.to);
      if (!isChildActive) setOpen(false);
    }
  }, [location.pathname]);

  // Only close sidebar on navigate for mobile
  const handleNavClick = () => {
    if (window.innerWidth < 1024 && onNavigate) onNavigate();
  };

  if (hasChildren) {
    return (
      <div>
        <button
          onClick={() => setOpen(!open)}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
            ${isActive ? 'text-primary-800 font-semibold' : 'text-primary-700/80 hover:bg-primary-100 hover:text-primary-800'}`}
        >
          <item.icon size={18} className="shrink-0" />
          <span className="flex-1 text-left">{item.label}</span>
          <ChevronDown size={14} className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
        </button>
        {open && (
          <div className="ml-5 mt-1 space-y-0.5 border-l-2 border-primary-200 pl-3">
            {item.children.map(child => (
              <NavLink
                key={child.to}
                to={child.to}
                end
                onClick={handleNavClick}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-200
                  ${isActive ? 'bg-primary-600 text-white shadow-sm' : 'text-gray-500 hover:bg-warm-100 hover:text-primary-700'}`
                }
              >
                <child.icon size={14} className="shrink-0 opacity-60" />
                {child.label}
              </NavLink>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <NavLink
      to={item.to}
      end={item.to === '/'}
      onClick={handleNavClick}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
        ${isActive ? 'bg-primary-600 text-white shadow-md' : 'text-primary-700/80 hover:bg-primary-100 hover:text-primary-800'}`
      }
    >
      <item.icon size={18} className="shrink-0" />
      <span>{item.label}</span>
    </NavLink>
  );
}

export default function Sidebar({ isOpen, onClose }) {
  const { schoolProfile, currentUser } = useApp();
  const filteredNavGroups = useMemo(
    () => filterNavGroups(navGroups, currentUser?.role),
    [currentUser?.role]
  );
  // Auto-close on route change only on mobile
  const location = useLocation();
  useEffect(() => {
    if (window.innerWidth < 1024) onClose();
  }, [location.pathname]);

  return (
    <>
      {/* Backdrop overlay (mobile) */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside className={`fixed top-0 left-0 h-screen w-[260px] bg-white border-r border-warm-200 flex flex-col z-50
        transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>

        {/* Logo */}
        <div className="px-4 h-[52px] border-b border-warm-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {schoolProfile?.logo ? (
              <img src={schoolProfile.logo} alt="Logo" className="w-9 h-9 rounded-lg object-contain shrink-0" />
            ) : (
              <div className="w-9 h-9 rounded-lg bg-primary-700 flex items-center justify-center shrink-0">
                <Landmark size={18} className="text-gold-400" />
              </div>
            )}
            <div className="overflow-hidden">
              <h1 className="text-sm font-bold text-primary-800 leading-tight truncate">{schoolProfile?.name || 'IB-MYP Rapor'}</h1>
              <p className="text-[11px] text-gray-400 leading-tight">Sistem Informasi Rapor IB-MYP</p>
            </div>
          </div>
          <button onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-warm-100 rounded-lg transition-all duration-200 lg:hidden">
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          {filteredNavGroups.map((group, gi) => (
            <div key={gi}>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 px-3 mb-2">{group.label}</p>
              <div className="space-y-0.5">
                {group.items.map((item, i) => (
                  <NavItem key={i} item={item} onNavigate={onClose} />
                ))}
              </div>
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}
