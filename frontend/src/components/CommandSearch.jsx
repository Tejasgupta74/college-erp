import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import {
  Search,
  X,
  BookOpen,
  Users,
  Building2,
  CalendarCheck2,
  CreditCard,
  Award,
  Bell,
  LayoutDashboard,
  ShieldCheck,
  ArrowRight
} from 'lucide-react';

export const CommandSearch = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      return;
    }

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setCourses([]);
      setStudents([]);
      return;
    }

    const timeout = setTimeout(async () => {
      setLoading(true);
      try {
        const [courseRes, studentRes] = await Promise.all([
          api.get('/academics/courses'),
          user?.role === 'admin' || user?.role === 'faculty'
            ? api.get(`/students?search=${encodeURIComponent(query)}`)
            : Promise.resolve({ data: { data: [] } }),
        ]);

        const filteredCourses = (courseRes.data.data || []).filter(
          (c) =>
            c.name.toLowerCase().includes(query.toLowerCase()) ||
            c.code.toLowerCase().includes(query.toLowerCase())
        );

        setCourses(filteredCourses.slice(0, 4));
        setStudents((studentRes.data.data || []).slice(0, 4));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timeout);
  }, [query, user]);

  if (!isOpen) return null;

  const quickNav = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Courses & Syllabus', path: '/courses', icon: BookOpen },
    { label: 'Attendance Portal', path: '/attendance', icon: CalendarCheck2 },
    { label: 'Fees & Invoices', path: '/fees', icon: CreditCard },
    { label: 'Examinations', path: '/exams', icon: Award },
    { label: 'Campus Notices', path: '/notices', icon: Bell },
  ];

  if (user?.role === 'admin') {
    quickNav.push(
      { label: 'Departments', path: '/departments', icon: Building2 },
      { label: 'Student Directory', path: '/students', icon: Users },
      { label: 'Faculty Members', path: '/faculty', icon: ShieldCheck }
    );
  }

  const handleSelect = (path) => {
    navigate(path);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col">
        {/* Input Bar */}
        <div className="p-4 border-b border-slate-100 flex items-center gap-3">
          <Search className="w-5 h-5 text-indigo-600" />
          <input
            autoFocus
            type="text"
            placeholder="Type to search courses, roll number, or jump to modules..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 text-sm bg-transparent border-none outline-none text-slate-800 placeholder:text-slate-400"
          />
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results / Navigation */}
        <div className="p-4 max-h-96 overflow-y-auto space-y-4 text-xs">
          {/* Live Search Results */}
          {query.trim().length >= 2 && (
            <div className="space-y-3">
              {loading && <p className="text-slate-400 text-center py-2">Searching institutional database...</p>}

              {courses.length > 0 && (
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5 px-2">
                    Courses Matching "{query}"
                  </span>
                  <div className="space-y-1">
                    {courses.map((c) => (
                      <button
                        key={c._id}
                        onClick={() => handleSelect('/courses')}
                        className="w-full p-2.5 rounded-xl hover:bg-indigo-50 flex items-center justify-between text-left group transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="font-mono font-bold text-indigo-600 bg-indigo-100/60 px-2 py-0.5 rounded text-[10px]">
                            {c.code}
                          </span>
                          <span className="font-semibold text-slate-800">{c.name}</span>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-indigo-600 transition-colors" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {students.length > 0 && (
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5 px-2">
                    Students Matching "{query}"
                  </span>
                  <div className="space-y-1">
                    {students.map((s) => (
                      <button
                        key={s._id}
                        onClick={() => handleSelect('/students')}
                        className="w-full p-2.5 rounded-xl hover:bg-indigo-50 flex items-center justify-between text-left group transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="font-mono text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                            {s.rollNo}
                          </span>
                          <span className="font-semibold text-slate-800">{s.user?.name}</span>
                          <span className="text-slate-400 text-[11px] font-medium">({s.department?.code})</span>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-indigo-600 transition-colors" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {!loading && courses.length === 0 && students.length === 0 && (
                <p className="text-slate-400 text-center py-4">No matching records found.</p>
              )}
            </div>
          )}

          {/* Quick Jump Modules */}
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2 px-2">
              Quick Navigation
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              {quickNav.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.path}
                    onClick={() => handleSelect(item.path)}
                    className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-slate-100 text-slate-700 font-semibold text-left transition-colors"
                  >
                    <Icon className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 px-4">
          <span>Tip: Press <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded font-mono text-[10px]">ESC</kbd> to close</span>
          <span>Apex ERP Spotlight Search</span>
        </div>
      </div>
    </div>
  );
};

export default CommandSearch;
