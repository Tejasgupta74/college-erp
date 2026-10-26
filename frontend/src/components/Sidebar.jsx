import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Building2,
  BookOpen,
  Users,
  GraduationCap,
  CalendarCheck2,
  CreditCard,
  Award,
  Bell,
  LogOut,
  ShieldCheck,
  X
} from 'lucide-react';

export const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleBadge = (role) => {
    const badge = {
      admin: { text: 'Super Admin', cls: 'bg-rose-100 text-rose-700' },
      faculty: { text: 'Faculty', cls: 'bg-amber-100 text-amber-700' },
      student: { text: 'Student', cls: 'bg-emerald-100 text-emerald-700' },
      accountant: { text: 'Finance', cls: 'bg-blue-100 text-blue-700' },
    }[role];
    return badge ? (
      <span className={`${badge.cls} text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider`}>
        {badge.text}
      </span>
    ) : null;
  };

  // Nav item helper with auto-close on mobile
  const linkClasses = ({ isActive }) =>
    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-xs sm:text-sm transition-all duration-150 ${
      isActive
        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 font-semibold'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
    }`;

  const handleNavClick = () => {
    if (onClose) onClose();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden transition-opacity"
        />
      )}

      <aside
        className={`fixed lg:sticky top-0 left-0 z-40 w-64 bg-white border-r border-slate-200 flex flex-col h-screen transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-100">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-base text-slate-900 tracking-tight leading-none">Apex Institute</h1>
              <span className="text-[11px] text-slate-500 font-medium">ERP Management</span>
            </div>
          </div>

          {/* Close button for mobile */}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 lg:hidden hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* User Mini Profile Card */}
        <div className="p-3.5 mx-3 my-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-xs text-slate-800 truncate">{user?.name}</p>
            <div className="mt-0.5">{getRoleBadge(user?.role)}</div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          <div className="px-3 pt-2 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Main Menu
          </div>

          <NavLink to="/dashboard" onClick={handleNavClick} className={linkClasses}>
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </NavLink>

          {/* Admin Navigation */}
          {user?.role === 'admin' && (
            <>
              <div className="px-3 pt-3 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Academic Administration
              </div>
              <NavLink to="/departments" onClick={handleNavClick} className={linkClasses}>
                <Building2 className="w-4 h-4" />
                Departments
              </NavLink>
              <NavLink to="/courses" onClick={handleNavClick} className={linkClasses}>
                <BookOpen className="w-4 h-4" />
                Courses & Syllabus
              </NavLink>
              <NavLink to="/students" onClick={handleNavClick} className={linkClasses}>
                <Users className="w-4 h-4" />
                Student Directory
              </NavLink>
              <NavLink to="/faculty" onClick={handleNavClick} className={linkClasses}>
                <ShieldCheck className="w-4 h-4" />
                Faculty Members
              </NavLink>
              <NavLink to="/attendance" onClick={handleNavClick} className={linkClasses}>
                <CalendarCheck2 className="w-4 h-4" />
                Attendance Master
              </NavLink>
              <NavLink to="/fees" onClick={handleNavClick} className={linkClasses}>
                <CreditCard className="w-4 h-4" />
                Fee Management
              </NavLink>
              <NavLink to="/exams" onClick={handleNavClick} className={linkClasses}>
                <Award className="w-4 h-4" />
                Examinations
              </NavLink>
            </>
          )}

          {/* Faculty Navigation */}
          {user?.role === 'faculty' && (
            <>
              <div className="px-3 pt-3 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Classroom & Grading
              </div>
              <NavLink to="/courses" onClick={handleNavClick} className={linkClasses}>
                <BookOpen className="w-4 h-4" />
                My Assigned Courses
              </NavLink>
              <NavLink to="/attendance" onClick={handleNavClick} className={linkClasses}>
                <CalendarCheck2 className="w-4 h-4" />
                Mark Attendance
              </NavLink>
              <NavLink to="/exams" onClick={handleNavClick} className={linkClasses}>
                <Award className="w-4 h-4" />
                Grade & Exam Marks
              </NavLink>
              <NavLink to="/students" onClick={handleNavClick} className={linkClasses}>
                <Users className="w-4 h-4" />
                Student Directory
              </NavLink>
            </>
          )}

          {/* Student Navigation */}
          {user?.role === 'student' && (
            <>
              <div className="px-3 pt-3 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Student Desk
              </div>
              <NavLink to="/courses" onClick={handleNavClick} className={linkClasses}>
                <BookOpen className="w-4 h-4" />
                Enrolled Courses
              </NavLink>
              <NavLink to="/attendance" onClick={handleNavClick} className={linkClasses}>
                <CalendarCheck2 className="w-4 h-4" />
                My Attendance
              </NavLink>
              <NavLink to="/fees" onClick={handleNavClick} className={linkClasses}>
                <CreditCard className="w-4 h-4" />
                Fee Receipts & Dues
              </NavLink>
              <NavLink to="/exams" onClick={handleNavClick} className={linkClasses}>
                <Award className="w-4 h-4" />
                Exam Marks & GPA
              </NavLink>
            </>
          )}

          {/* Accountant Navigation */}
          {user?.role === 'accountant' && (
            <>
              <div className="px-3 pt-3 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Accounts Office
              </div>
              <NavLink to="/fees" onClick={handleNavClick} className={linkClasses}>
                <CreditCard className="w-4 h-4" />
                Invoices & Payments
              </NavLink>
              <NavLink to="/students" onClick={handleNavClick} className={linkClasses}>
                <Users className="w-4 h-4" />
                Student Accounts
              </NavLink>
            </>
          )}

          {/* Notice Board */}
          <div className="px-3 pt-3 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Campus Broadcasts
          </div>
          <NavLink to="/notices" onClick={handleNavClick} className={linkClasses}>
            <Bell className="w-4 h-4" />
            Notice Board
          </NavLink>
        </nav>

        {/* Footer / Logout */}
        <div className="p-3 border-t border-slate-200">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-xs text-rose-600 hover:bg-rose-50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
