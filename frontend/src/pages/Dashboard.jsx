import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import {
  Users,
  GraduationCap,
  Building2,
  BookOpen,
  CreditCard,
  CalendarCheck2,
  AlertTriangle,
  Bell,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react';

export const Dashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/dashboard/stats');
        setData(res.data.data);
      } catch (err) {
        console.error('Failed to load dashboard stats', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-72">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const role = user?.role;
  const metrics = data?.metrics || {};

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-violet-600 rounded-3xl p-8 text-white shadow-xl shadow-indigo-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Academic Session 2025-2026</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Welcome back, {user?.name}!
          </h1>
          <p className="text-indigo-100 text-sm mt-1 max-w-xl">
            {role === 'admin' && 'System overview and campus administration control center.'}
            {role === 'faculty' && 'Manage your lecture sessions, mark attendance, and evaluate students.'}
            {role === 'student' && 'Check your attendance percentage, upcoming exams, and fee receipts.'}
            {role === 'accountant' && 'Track fee invoices, record transactions, and monitor campus finances.'}
          </p>
        </div>

        {/* Quick action buttons */}
        <div className="flex flex-wrap gap-2.5">
          {role === 'admin' && (
            <>
              <Link
                to="/students"
                className="bg-white text-indigo-700 hover:bg-indigo-50 font-semibold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-colors"
              >
                <Users className="w-4 h-4" /> Add Student
              </Link>
              <Link
                to="/courses"
                className="bg-indigo-500/40 hover:bg-indigo-500/60 text-white font-semibold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition-colors"
              >
                <BookOpen className="w-4 h-4" /> Manage Courses
              </Link>
            </>
          )}

          {role === 'faculty' && (
            <Link
              to="/attendance"
              className="bg-white text-indigo-700 hover:bg-indigo-50 font-semibold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <CalendarCheck2 className="w-4 h-4" /> Mark Attendance
            </Link>
          )}

          {role === 'student' && (
            <Link
              to="/attendance"
              className="bg-white text-indigo-700 hover:bg-indigo-50 font-semibold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <CalendarCheck2 className="w-4 h-4" /> View Attendance
            </Link>
          )}

          {role === 'accountant' && (
            <Link
              to="/fees"
              className="bg-white text-indigo-700 hover:bg-indigo-50 font-semibold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <CreditCard className="w-4 h-4" /> Record Payment
            </Link>
          )}
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {role === 'admin' && (
          <>
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Enrolled</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">{metrics.totalStudents || 0}</h3>
                <span className="text-xs text-emerald-600 font-medium mt-1 inline-flex items-center gap-1">
                  Active Students
                </span>
              </div>
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Faculty Staff</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">{metrics.totalFaculty || 0}</h3>
                <span className="text-xs text-slate-500 font-medium mt-1 inline-block">Professors & Instructors</span>
              </div>
              <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
                <GraduationCap className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Academic Depts</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">{metrics.totalDepartments || 0}</h3>
                <span className="text-xs text-slate-500 font-medium mt-1 inline-block">Engineering & Tech</span>
              </div>
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                <Building2 className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Fee Collection</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">₹{(metrics.totalCollected || 0).toLocaleString()}</h3>
                <span className="text-xs text-rose-600 font-medium mt-1 inline-block">
                  ₹{(metrics.totalPending || 0).toLocaleString()} Pending
                </span>
              </div>
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                <CreditCard className="w-6 h-6" />
              </div>
            </div>
          </>
        )}

        {role === 'student' && (
          <>
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Attendance Rate</p>
                <h3 className={`text-2xl font-bold mt-1 ${metrics.isAttendanceShortage ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {metrics.attendancePercent || 0}%
                </h3>
                <span className="text-xs text-slate-500 font-medium mt-1 inline-block">
                  {metrics.totalClassesAttended || '0/0'} Sessions
                </span>
              </div>
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${metrics.isAttendanceShortage ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                {metrics.isAttendanceShortage ? <AlertTriangle className="w-6 h-6" /> : <CheckCircle2 className="w-6 h-6" />}
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Fee Balance</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">
                  ₹{(metrics.feePending || 0).toLocaleString()}
                </h3>
                <span className="text-xs text-emerald-600 font-medium mt-1 inline-block">
                  ₹{(metrics.feePaid || 0).toLocaleString()} Paid
                </span>
              </div>
              <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
                <CreditCard className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Current Semester</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">
                  Semester {data?.profile?.semester || 1}
                </h3>
                <span className="text-xs text-slate-500 font-medium mt-1 inline-block">
                  Section {data?.profile?.section || 'A'}
                </span>
              </div>
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                <BookOpen className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Enrollment No</p>
                <h3 className="text-lg font-bold text-slate-900 mt-1">
                  {data?.profile?.enrollmentNo || 'N/A'}
                </h3>
                <span className="text-xs text-slate-500 font-medium mt-1 inline-block">
                  Roll: {data?.profile?.rollNo || 'N/A'}
                </span>
              </div>
              <div className="w-12 h-12 bg-violet-50 text-violet-600 rounded-2xl flex items-center justify-center">
                <GraduationCap className="w-6 h-6" />
              </div>
            </div>
          </>
        )}

        {role === 'faculty' && (
          <>
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Assigned Subjects</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">{metrics.assignedCoursesCount || 0}</h3>
                <span className="text-xs text-indigo-600 font-medium mt-1 inline-block">Active Courses</span>
              </div>
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                <BookOpen className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Classes Conducted</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">{metrics.classesConducted || 0}</h3>
                <span className="text-xs text-emerald-600 font-medium mt-1 inline-block">Sessions logged</span>
              </div>
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                <CalendarCheck2 className="w-6 h-6" />
              </div>
            </div>
          </>
        )}

        {role === 'accountant' && (
          <>
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Billed</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">₹{(metrics.totalBilled || 0).toLocaleString()}</h3>
                <span className="text-xs text-slate-500 font-medium mt-1 inline-block">All Semesters</span>
              </div>
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                <CreditCard className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Collected</p>
                <h3 className="text-2xl font-bold text-emerald-600 mt-1">₹{(metrics.totalCollected || 0).toLocaleString()}</h3>
                <span className="text-xs text-slate-500 font-medium mt-1 inline-block">Cleared payments</span>
              </div>
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Invoices</p>
                <h3 className="text-2xl font-bold text-rose-600 mt-1">{metrics.pendingInvoices || 0}</h3>
                <span className="text-xs text-slate-500 font-medium mt-1 inline-block">Requires Followup</span>
              </div>
              <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center">
                <AlertTriangle className="w-6 h-6" />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Low Attendance Alert for Student */}
      {role === 'student' && metrics.isAttendanceShortage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-rose-800">
          <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-sm">Attendance Shortage Warning!</h4>
            <p className="text-xs text-rose-700 mt-0.5">
              Your overall attendance is currently at <span className="font-bold">{metrics.attendancePercent}%</span>, which is below the mandatory 75% university eligibility requirement for final examinations. Please consult your academic mentor.
            </p>
          </div>
        </div>
      )}

      {/* Visual Analytics Bar */}
      {(role === 'admin' || role === 'accountant') && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="font-bold text-sm text-slate-800">Campus Fee Realization Progress</h3>
              <p className="text-xs text-slate-400">Total institutional receivables vs collections settled</p>
            </div>
            <span className="font-black text-indigo-700 text-lg">
              {metrics.totalBilled > 0 ? Math.round((metrics.totalCollected / metrics.totalBilled) * 100) : 0}% Realized
            </span>
          </div>

          {/* Multi-segment progress bar */}
          <div className="w-full bg-slate-100 h-3.5 rounded-full overflow-hidden flex">
            <div
              className="bg-emerald-500 h-full transition-all duration-500"
              style={{
                width: `${metrics.totalBilled > 0 ? Math.min(100, (metrics.totalCollected / metrics.totalBilled) * 100) : 0}%`,
              }}
              title="Collected"
            ></div>
            <div
              className="bg-rose-400 h-full transition-all duration-500"
              style={{
                width: `${metrics.totalBilled > 0 ? Math.min(100, (metrics.totalPending / metrics.totalBilled) * 100) : 0}%`,
              }}
              title="Pending"
            ></div>
          </div>

          <div className="flex flex-wrap items-center justify-between text-xs text-slate-600 pt-1">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                Collected: <strong className="text-slate-900">₹{(metrics.totalCollected || 0).toLocaleString()}</strong>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-400"></span>
                Pending Dues: <strong className="text-rose-600">₹{(metrics.totalPending || 0).toLocaleString()}</strong>
              </span>
            </div>
            <span className="text-slate-400">
              Total Budgeted: <strong className="text-slate-800">₹{(metrics.totalBilled || 0).toLocaleString()}</strong>
            </span>
          </div>
        </div>
      )}

      {role === 'student' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="font-bold text-sm text-slate-800">Semester Attendance Compliance Meter</h3>
              <p className="text-xs text-slate-400">Target minimum threshold: 75.0% for end-term examinations</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${metrics.attendancePercent >= 75 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                {metrics.attendancePercent >= 75 ? 'Safe Standing' : 'Shortage Alert'}
              </span>
              <span className="font-black text-lg text-slate-900">{metrics.attendancePercent}%</span>
            </div>
          </div>

          <div className="relative w-full bg-slate-100 h-4 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${metrics.attendancePercent >= 75 ? 'bg-emerald-500' : 'bg-rose-500'}`}
              style={{ width: `${Math.min(100, metrics.attendancePercent || 0)}%` }}
            ></div>
            {/* 75% indicator line */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-slate-900/60 z-10"
              style={{ left: '75%' }}
              title="75% Mandatory Cutoff"
            ></div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Attended: <strong className="text-slate-800">{metrics.totalClassesAttended} Sessions</strong></span>
            <span className="font-medium text-slate-400">75% Cutoff Marker</span>
          </div>
        </div>
      )}

      {/* Main Grid: Campus Notices & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Recent Notices */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                <Bell className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-base text-slate-800">Campus Notice Board</h3>
            </div>
            <Link
              to="/notices"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              View All <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3.5">
            {data?.recentNotices?.length > 0 ? (
              data.recentNotices.map((notice) => (
                <div
                  key={notice._id}
                  className="p-4 rounded-2xl bg-slate-50/70 hover:bg-slate-100/80 border border-slate-100 transition-colors"
                >
                  <div className="flex items-center justify-between gap-3 mb-1.5">
                    <h4 className="font-semibold text-sm text-slate-900 line-clamp-1">{notice.title}</h4>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        notice.priority === 'Urgent'
                          ? 'bg-rose-100 text-rose-700'
                          : notice.priority === 'Important'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {notice.priority}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{notice.content}</p>
                  <div className="flex items-center gap-2 mt-2.5 text-[11px] text-slate-400 font-medium">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(notice.createdAt).toLocaleDateString()}</span>
                    <span>•</span>
                    <span>Audience: {notice.targetAudience}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 py-4 text-center">No notices published yet.</p>
            )}
          </div>
        </div>

        {/* Right Col: Academic Shortcuts & System Health */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm">
            <h3 className="font-bold text-base text-slate-800 mb-4">Quick Modules</h3>
            <div className="space-y-2">
              {[
                { to: '/courses', label: 'Courses & Syllabus', icon: BookOpen, color: 'bg-indigo-50 text-indigo-600', roles: ['admin', 'faculty', 'student'] },
                { to: '/attendance', label: 'Attendance Records', icon: CalendarCheck2, color: 'bg-emerald-50 text-emerald-600', roles: ['admin', 'faculty', 'student'] },
                { to: '/exams', label: 'Examinations & GPA', icon: GraduationCap, color: 'bg-amber-50 text-amber-600', roles: ['admin', 'faculty', 'student'] },
                { to: '/fees', label: 'Fee Payments & Receipts', icon: CreditCard, color: 'bg-blue-50 text-blue-600', roles: ['admin', 'accountant', 'student'] },
                { to: '/students', label: 'Student Accounts', icon: Users, color: 'bg-violet-50 text-violet-600', roles: ['accountant'] },
              ]
                .filter((m) => m.roles.includes(role))
                .map(({ to, label, icon: Icon, color }) => (
                  <Link
                    key={to}
                    to={to}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all text-xs font-medium text-slate-700"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span>{label}</span>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-slate-400" />
                  </Link>
                ))}
            </div>
          </div>

          {/* System status pill */}
          <div className="bg-slate-900 text-white rounded-3xl p-5 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">System Status</span>
              <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> Operational
              </span>
            </div>
            <p className="text-xs text-slate-400">
              MERN Stack running on Node.js + Express with MongoDB ACID replica.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
