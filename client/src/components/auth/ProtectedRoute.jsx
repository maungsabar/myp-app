import { Navigate, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { ROLE_ACCESS } from '../../context/AppContext';
import { ShieldX } from 'lucide-react';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, authLoading, currentUser } = useApp();
  const location = useLocation();

  // Still checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-warm-50">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500">Memuat...</p>
        </div>
      </div>
    );
  }

  // Not authenticated → redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role-based access
  if (allowedRoles && currentUser) {
    const userAccess = ROLE_ACCESS[currentUser.role] || [];
    const hasAccess = userAccess.includes('*') || allowedRoles.some(path => userAccess.includes(path));
    if (!hasAccess) {
      return (
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
              <ShieldX size={32} className="text-red-400" />
            </div>
            <h2 className="text-lg font-bold text-gray-800 mb-2">Akses Ditolak</h2>
            <p className="text-sm text-gray-500 mb-1">
              Anda tidak memiliki izin untuk mengakses halaman ini.
            </p>
            <p className="text-xs text-gray-400">
              Role: <span className="font-medium">{currentUser.role}</span>
            </p>
          </div>
        </div>
      );
    }
  }

  return children;
}
