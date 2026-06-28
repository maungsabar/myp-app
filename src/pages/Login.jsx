import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { ROLE_ACCESS } from '../context/AppContext';
import api from '../services/api';
import { Landmark, LogIn, Eye, EyeOff, AlertCircle, Loader2, KeyRound, X } from 'lucide-react';

// Get default redirect path based on user role
function getDefaultPath(role) {
  const access = ROLE_ACCESS[role] || [];
  if (access.includes('*') || access.includes('/')) return '/';
  return access[0] || '/login';
}

export default function Login() {
  const { login, isAuthenticated, authLoading, currentUser } = useApp();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showChangePw, setShowChangePw] = useState(false);
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [changePwError, setChangePwError] = useState('');
  const [changePwLoading, setChangePwLoading] = useState(false);
  const [schoolInfo, setSchoolInfo] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Fetch school profile from public endpoint
  useEffect(() => {
    fetch('/api/school-profile/public')
      .then(res => res.json())
      .then(data => setSchoolInfo({ name: data.name || '', logo: data.logo || null }))
      .catch(() => setSchoolInfo({ name: 'Sistem Rapor IB-MYP', logo: null }));
  }, []);

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated && currentUser && !currentUser.isDefaultPassword) {
      const from = location.state?.from?.pathname || getDefaultPath(currentUser.role);
      navigate(from, { replace: true });
    }
    // Show change password modal if default password
    if (!authLoading && isAuthenticated && currentUser?.isDefaultPassword) {
      setShowChangePw(true);
    }
  }, [authLoading, isAuthenticated, currentUser, navigate, location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) { setError('Username dan password wajib diisi.'); return; }
    setError('');
    setLoading(true);
    try {
      const user = await login(username, password);
      if (user.isDefaultPassword) {
        setShowChangePw(true);
      } else {
        const from = location.state?.from?.pathname || getDefaultPath(user.role);
        navigate(from, { replace: true });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!newPw || newPw.length < 6) { setChangePwError('Password baru minimal 6 karakter.'); return; }
    if (newPw !== confirmPw) { setChangePwError('Konfirmasi password tidak cocok.'); return; }
    setChangePwError('');
    setChangePwLoading(true);
    try {
      await api.changePassword(password, newPw);
      setShowChangePw(false);
      const from = location.state?.from?.pathname || getDefaultPath(currentUser?.role);
      navigate(from, { replace: true });
    } catch (err) {
      setChangePwError(err.message);
    } finally {
      setChangePwLoading(false);
    }
  };

  // Education-themed floating icon paths (SVG path data)
  const eduIcons = [
    // Book open
    { path: 'M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25' },
    // Pencil
    { path: 'M16.862 4.487l1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931z' },
    // Graduation cap
    { path: 'M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15v3.75m0 0h10.5m-10.5 0V15' },
    // Globe
    { path: 'M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5a17.92 17.92 0 0 1-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418' },
    // Atom / Science
    { path: 'M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 0 1 4.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0 1 12 15a9.065 9.065 0 0 0-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0 1 12 21a48.25 48.25 0 0 1-8.135-.687c-1.718-.293-2.3-2.379-1.067-3.61L5 14.5' },
    // Calculator
    { path: 'M15.75 15.75V18m-7.5-6.75h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25V13.5zm0 2.25h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25V18zm2.498-6.75h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V13.5zm0 2.25h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V18zm2.504-6.75h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V13.5zM8.25 6h7.5v2.25h-7.5V6zM3.75 20.25V3.75A2.25 2.25 0 0 1 6 1.5h12a2.25 2.25 0 0 1 2.25 2.25v16.5A2.25 2.25 0 0 1 18 22.5H6a2.25 2.25 0 0 1-2.25-2.25z' },
    // Light bulb
    { path: 'M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.517 0c.85.493 1.509 1.333 1.509 2.316V18' },
    // Musical note
    { path: 'm9 9 10.5-3m0 6.553v3.75a2.25 2.25 0 0 1-1.632 2.163l-1.32.377a1.803 1.803 0 1 1-.99-3.467l2.31-.66a2.25 2.25 0 0 0 1.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 0 1-1.632 2.163l-1.32.377a1.803 1.803 0 0 1-.99-3.467l2.31-.66A2.25 2.25 0 0 0 9 15.553z' },
    // Star
    { path: 'M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5z' },
    // Trophy
    { path: 'M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 0 1-.982-3.172M9.497 14.25a7.454 7.454 0 0 0 .982-3.172M8.25 9.167c0 .78-.218 1.522-.6 2.168A4.5 4.5 0 0 1 3 6.75V6a2.25 2.25 0 0 1 2.25-2.25h1.372c.516 0 .966.351 1.091.852l.427 1.71a.375.375 0 0 1-.091.34L6.75 8.085a2.25 2.25 0 0 0-.434 1.082M15.75 9.167c0 .78.218 1.522.6 2.168A4.5 4.5 0 0 0 21 6.75V6a2.25 2.25 0 0 0-2.25-2.25h-1.372a1.125 1.125 0 0 0-1.091.852l-.427 1.71a.375.375 0 0 0 .091.34l1.299 1.433a2.25 2.25 0 0 1 .434 1.082' },
    // Puzzle piece
    { path: 'M14.25 6.087c0-.355.186-.676.401-.959.221-.29.349-.634.349-1.003 0-1.036-1.007-1.875-2.25-1.875s-2.25.84-2.25 1.875c0 .369.128.713.349 1.003.215.283.401.604.401.959v0a.64.64 0 0 1-.657.643 48.39 48.39 0 0 0-4.163.434c-1.31.194-2.294 1.301-2.33 2.621A48.615 48.615 0 0 0 4.044 14c-.012.49.074.976.253 1.43a2.625 2.625 0 0 0 2.457 1.695c.374 0 .718-.128 1.003-.349.283-.215.604-.401.959-.401s.676.186.959.401c.285.221.629.349 1.003.349a2.625 2.625 0 0 0 2.457-1.695c.179-.454.265-.94.253-1.43a48.63 48.63 0 0 0-.056-4.149c-.036-1.32-1.02-2.427-2.33-2.62a48.4 48.4 0 0 0-4.163-.435h0a.64.64 0 0 1-.657-.643v0z' },
    // Ruler
    { path: 'M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15' },
  ];

  // Generate floating icon particles with random properties
  const floatingIcons = useMemo(() => {
    return Array.from({ length: 20 }, (_, i) => ({
      id: i,
      icon: eduIcons[i % eduIcons.length],
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 16 + Math.random() * 20,
      duration: 15 + Math.random() * 25,
      delay: Math.random() * -30,
      opacity: 0.06 + Math.random() * 0.1,
      rotate: Math.random() * 360,
    }));
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-800 via-primary-700 to-primary-900 p-4 overflow-hidden relative">
      {/* Animated background: floating education icons */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Radial glow accents */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-400/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gold-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-2/3 left-1/2 w-64 h-64 bg-primary-300/8 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '4s' }} />

        {/* Floating education icons */}
        {floatingIcons.map(item => (
          <div
            key={item.id}
            className="absolute"
            style={{
              left: `${item.x}%`,
              top: `${item.y}%`,
              opacity: item.opacity,
              animation: `loginFloat ${item.duration}s ease-in-out ${item.delay}s infinite`,
            }}
          >
            <svg
              width={item.size}
              height={item.size}
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ transform: `rotate(${item.rotate}deg)` }}
            >
              <path d={item.icon.path} />
            </svg>
          </div>
        ))}

        {/* Subtle grid overlay for depth */}
        <svg width="100%" height="100%" className="opacity-[0.03]">
          <defs>
            <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="white" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <div className="relative w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden animate-fade-in">
          {/* Header */}
          <div className="px-8 pt-8 pb-6 text-center bg-gradient-to-b from-primary-50 to-white">
            {!schoolInfo ? (
              <div className="w-16 h-16 rounded-2xl bg-primary-700 flex items-center justify-center mx-auto mb-4 shadow-lg">
                <div className="w-6 h-6 border-2 border-gold-300 border-t-gold-500 rounded-full animate-spin" />
              </div>
            ) : schoolInfo.logo ? (
              <img src={schoolInfo.logo} alt="Logo" className="w-16 h-16 object-contain mx-auto mb-4" />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-primary-700 flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Landmark size={28} className="text-gold-400" />
              </div>
            )}
            <h1 className={`text-xl font-bold text-primary-800 transition-opacity duration-300 ${!schoolInfo ? 'opacity-0' : 'opacity-100'}`}>{schoolInfo?.name || ''}</h1>
            <p className={`text-sm text-gray-500 mt-1 transition-opacity duration-300 ${!schoolInfo ? 'opacity-0' : 'opacity-100'}`}>Sistem Informasi Rapor IB-MYP</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-8 pb-8 space-y-5">
            {error && (
              <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                <AlertCircle size={16} className="shrink-0" />
                {error}
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Username</label>
              <input
                type="text" value={username} onChange={e => setUsername(e.target.value)}
                placeholder="Masukan username" disabled={loading}
                className="w-full px-4 py-3 text-sm border border-warm-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 transition-all duration-200 disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="Masukan password" disabled={loading}
                  className="w-full px-4 py-3 text-sm border border-warm-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 transition-all duration-200 disabled:opacity-50"
                />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? <Loader2 size={18} className="animate-spin" /> : <LogIn size={18} />}
              {loading ? 'Memasuk...' : 'Masuk'}
            </button>
          </form>
        </div>

        <p className={`text-center text-xs text-white/50 mt-6 transition-opacity duration-300 ${!schoolInfo ? 'opacity-0' : 'opacity-100'}`}>
          {schoolInfo?.name || ''} &copy; {new Date().getFullYear()}
        </p>
      </div>

      {/* Change Password Modal */}
      {showChangePw && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm animate-fade-in overflow-hidden">
            <div className="px-6 pt-6 pb-4 bg-gradient-to-b from-amber-50 to-white text-center">
              <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center mx-auto mb-3">
                <KeyRound size={24} className="text-amber-600" />
              </div>
              <h2 className="text-base font-bold text-gray-800">Ubah Password</h2>
              <p className="text-xs text-gray-500 mt-1">Anda masih menggunakan password default. Silakan buat password baru.</p>
            </div>
            <div className="px-6 pb-6 space-y-4">
              {changePwError && (
                <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
                  <AlertCircle size={14} className="shrink-0" />
                  {changePwError}
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Password Baru</label>
                <input type="password" value={newPw} onChange={e => setNewPw(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  className="w-full px-3 py-2.5 text-sm border border-warm-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Konfirmasi Password</label>
                <input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)}
                  placeholder="Ulangi password baru"
                  className="w-full px-3 py-2.5 text-sm border border-warm-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400" />
              </div>
              <button onClick={handleChangePassword} disabled={changePwLoading}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-all duration-200 disabled:opacity-50">
                {changePwLoading ? <Loader2 size={16} className="animate-spin" /> : <KeyRound size={16} />}
                {changePwLoading ? 'Menyimpan...' : 'Simpan Password Baru'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
