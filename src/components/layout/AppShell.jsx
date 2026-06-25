import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import Sidebar from './Sidebar';
import Header from './Header';
import Footer from './Footer';
import ToastBanner from './ToastBanner';
import { Landmark } from 'lucide-react';

export default function AppShell() {
  const { loading, isAuthenticated, authLoading } = useApp();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Auto-open sidebar on desktop, keep closed on mobile
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const handler = (e) => setSidebarOpen(e.matches);
    setSidebarOpen(mq.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Show loading screen while auth is being checked OR data is still loading
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-warm-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl bg-primary-700 flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Landmark size={26} className="text-gold-400" />
          </div>
          <div className="w-8 h-8 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500">Memuat data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-warm-50 flex flex-col">
      <ToastBanner />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className={`min-w-0 flex-1 flex flex-col transition-all duration-300 ${sidebarOpen ? 'lg:ml-[260px]' : ''}`}>
        <Header onMenuToggle={() => setSidebarOpen(prev => !prev)} />
        <main className="flex-1 p-4 sm:p-6">
          <Outlet />
        </main>
        <Footer />
      </div>
    </div>
  );
}
