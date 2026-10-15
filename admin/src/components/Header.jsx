import React from 'react';
import { Menu, Sun, Moon, Send, ShieldCheck } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAdminAuth } from '../context/AdminAuthContext';

export const Header = ({ onOpenSidebar }) => {
  const { isDark, toggleTheme } = useTheme();
  const { admin } = useAdminAuth();
  const location = useLocation();

  const getPageTitle = (pathname) => {
    switch (pathname) {
      case '/':
      case '/overview':
        return 'System Overview';
      case '/send':
        return 'Compose Push Notification';
      case '/history':
        return 'Notification Campaign History';
      case '/devices':
        return 'Registered Mobile Devices';
      case '/users':
        return 'User & Token Directory';
      case '/scheduled':
        return 'Scheduled Campaigns';
      case '/settings':
        return 'Security & Administrator Settings';
      default:
        return 'Admin Dashboard';
    }
  };

  return (
    <header className="sticky top-0 z-30 h-20 px-6 lg:px-8 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
      <div className="flex items-center space-x-4">
        <button
          onClick={onOpenSidebar}
          className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 lg:hidden rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          aria-label="Open sidebar"
        >
          <Menu className="w-6 h-6" />
        </button>

        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            {getPageTitle(location.pathname)}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
            Production Push Notification Engine • Expo SDK 57 Integration
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-3">
        {/* Admin Privilege Indicator */}
        <div className="hidden md:flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Role: {admin?.role?.toUpperCase() || 'ADMIN'}</span>
        </div>

        {/* Quick Send Button (if not on send page) */}
        {location.pathname !== '/send' && (
          <Link
            to="/send"
            className="hidden sm:inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-brand-600 hover:bg-brand-500 text-white shadow-sm shadow-brand-500/30 transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
            <span>New Notification</span>
          </Link>
        )}

        {/* Dark/Light Mode Switcher */}
        <button
          onClick={toggleTheme}
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors"
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>
      </div>
    </header>
  );
};
