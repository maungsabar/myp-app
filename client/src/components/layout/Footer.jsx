const APP_VERSION = '1.0.0';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-warm-200 bg-white/60 px-4 sm:px-6 py-3 mt-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-gray-400">
        <p>
          &copy; {year} IB-MYP School Management System. All rights reserved.
        </p>
        <div className="flex items-center gap-3">
          <span>Created by <span className="font-medium text-gray-500">DNK Dev</span></span>
          <span className="w-px h-3 bg-warm-200" />
          <span className="font-mono bg-warm-100 text-gray-500 px-1.5 py-0.5 rounded">v{APP_VERSION}</span>
        </div>
      </div>
    </footer>
  );
}
