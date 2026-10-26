import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import NotificationDropdown from './NotificationDropdown';
import ProfileModal from './ProfileModal';
import CommandSearch from './CommandSearch';
import { Search, Calendar, Menu, User, KeyRound, LogOut, ChevronDown } from 'lucide-react';

export const Navbar = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showCommandSearch, setShowCommandSearch] = useState(false);
  const menuRef = useRef(null);

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
  });

  // Global Ctrl+K / Cmd+K shortcut for command search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setShowCommandSearch((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close profile dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setShowProfileMenu(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30 shadow-sm">
        {/* Left: Mobile Toggle & Quick Search */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl lg:hidden transition-colors"
            title="Toggle Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Search Trigger */}
          <button
            type="button"
            onClick={() => setShowCommandSearch(true)}
            className="flex items-center gap-3 bg-slate-100 hover:bg-slate-200 px-3.5 py-1.5 rounded-xl w-48 sm:w-72 text-slate-400 text-xs text-left border border-slate-200/60 transition-all hover:border-indigo-300"
          >
            <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <span className="truncate">Search courses, students...</span>
            <kbd className="hidden sm:inline-block ml-auto text-[10px] font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-500">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="hidden lg:flex items-center gap-2 text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200/60">
            <Calendar className="w-3.5 h-3.5 text-indigo-600" />
            <span>{currentDate}</span>
          </div>

          <NotificationDropdown />

          {/* User Profile Dropdown */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2.5 p-1 rounded-2xl hover:bg-slate-100 transition-colors"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white font-bold flex items-center justify-center text-sm shadow-sm">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div className="hidden md:block text-left pr-1">
                <p className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[120px]">{user?.name}</p>
                <p className="text-[10px] text-indigo-600 font-semibold uppercase tracking-wider">{user?.role}</p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-1.5 z-50 animate-fade-in text-xs">
                <div className="px-4 py-2.5 border-b border-slate-100">
                  <p className="font-bold text-slate-900 truncate">{user?.name}</p>
                  <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
                </div>

                <div className="py-1">
                  <button
                    onClick={() => { setShowProfileMenu(false); setShowProfileModal(true); }}
                    className="w-full px-4 py-2 text-left font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 flex items-center gap-2.5 transition-colors"
                  >
                    <User className="w-4 h-4 text-slate-400" />
                    My Account Dossier
                  </button>

                  <button
                    onClick={() => { setShowProfileMenu(false); setShowProfileModal(true); }}
                    className="w-full px-4 py-2 text-left font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 flex items-center gap-2.5 transition-colors"
                  >
                    <KeyRound className="w-4 h-4 text-slate-400" />
                    Change Password
                  </button>
                </div>

                <div className="pt-1 border-t border-slate-100">
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-2 text-left font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 transition-colors"
                  >
                    <LogOut className="w-4 h-4 text-rose-500" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Global Modals */}
      <ProfileModal isOpen={showProfileModal} onClose={() => setShowProfileModal(false)} />
      <CommandSearch isOpen={showCommandSearch} onClose={() => setShowCommandSearch(false)} />
    </>
  );
};

export default Navbar;
