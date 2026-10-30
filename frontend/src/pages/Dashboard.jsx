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
  BarChart3,
  TrendingUp,
  PieChart as PieChartIcon,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#3b82f6'];

export const Dashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
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
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-72">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const role = user?.role;
  const metrics = data?.metrics || {};
  const analytics = data?.analytics || {};

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
            {role === 'admin' && 'Real-time campus administration control center and interactive institutional analytics.'}
            {role === 'faculty' && 'Review syllabus progress, monitor attendance trends, and inspect student grade distributions.'}
            {role === 'student' && 'Explore your semester academic standing, subject-wise attendance, and fee history.'}
            {role === 'accountant' && 'Track fee invoices, record transactions, and analyze collection channels.'}
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
                <span className="text-xs text-emerald-600 font-medium mt-1 inline-flex items-center gap-1">Active Students</span>
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
                <h3 className="text-2xl font-bold text-slate-900 mt-1">₹{(metrics.feePending || 0).toLocaleString()}</h3>
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
                <h3 className="text-2xl font-bold text-slate-900 mt-1">Semester {data?.profile?.semester || 1}</h3>
                <span className="text-xs text-slate-500 font-medium mt-1 inline-block">Section {data?.profile?.section || 'A'}</span>
              </div>
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                <BookOpen className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Enrollment No</p>
                <h3 className="text-lg font-bold text-slate-900 mt-1">{data?.profile?.enrollmentNo || 'N/A'}</h3>
                <span className="text-xs text-slate-500 font-medium mt-1 inline-block">Roll: {data?.profile?.rollNo || 'N/A'}</span>
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
              Your overall attendance is currently at <span className="font-bold">{metrics.attendancePercent}%</span>, which is below the mandatory 75% university eligibility requirement for final examinations.
            </p>
          </div>
        </div>
      )}

      {/* ==================== INTERACTIVE ANALYTICS SECTION ==================== */}
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-indigo-600" />
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Interactive Analytics & Statistics</h2>
        </div>

        {/* ADMIN ANALYTICS GRID */}
        {role === 'admin' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Department Headcount Bar Chart */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Department Enrolment</h3>
                  <p className="text-xs text-slate-400">Total student headcount distributed by branch</p>
                </div>
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <BarChart3 className="w-4 h-4" />
                </div>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.deptDistribution || []}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                    />
                    <Bar dataKey="students" fill="#6366f1" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Fee Collection Trend */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Monthly Fee Realization</h3>
                  <p className="text-xs text-slate-400">Cashflow trajectory across academic calendar</p>
                </div>
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analytics.feeMonthly || []}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <Tooltip
                      formatter={(val) => [`₹${Number(val).toLocaleString()}`, 'Collected']}
                      contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                    />
                    <Line type="monotone" dataKey="amount" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* FACULTY ANALYTICS GRID */}
        {role === 'faculty' && (
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Lecture Attendance Rate Trends</h3>
                <p className="text-xs text-slate-400">Class presence velocity across recent 10 sessions</p>
              </div>
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analytics.attendanceTrend || []}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="session" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    formatter={(val) => [`${val}%`, 'Attendance Rate']}
                    contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  />
                  <Line type="monotone" dataKey="rate" stroke="#6366f1" strokeWidth={3} dot={{ r: 4, fill: '#6366f1' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* STUDENT ANALYTICS GRID */}
        {role === 'student' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Subject-wise Attendance Bar */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Subject Attendance Standing</h3>
                  <p className="text-xs text-slate-400">Compliance vs 75% minimum eligibility requirement</p>
                </div>
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <BarChart3 className="w-4 h-4" />
                </div>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.courseAttendance || []}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="subject" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <Tooltip
                      formatter={(val) => [`${val}%`, 'Attendance']}
                      contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                    />
                    <Bar dataKey="percentage" fill="#4f46e5" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Exam Marks Breakdown */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Exam Marks Scorecard</h3>
                  <p className="text-xs text-slate-400">Performance scored in recent examinations</p>
                </div>
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                  <GraduationCap className="w-4 h-4" />
                </div>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.performance || []}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="subject" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <Tooltip
                      formatter={(val) => [`${val} Marks`, 'Score']}
                      contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                    />
                    <Bar dataKey="score" fill="#10b981" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* ACCOUNTANT ANALYTICS GRID */}
        {role === 'accountant' && (
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Payment Collection Channels</h3>
                <p className="text-xs text-slate-400">Total institutional volume settled by payment mode</p>
              </div>
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                <PieChartIcon className="w-4 h-4" />
              </div>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics.paymentChannels || []}
                    dataKey="value"
                    nameKey="method"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ method, percent }) => `${method}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {(analytics.paymentChannels || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val) => [`₹${Number(val).toLocaleString()}`, 'Amount']}
                    contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

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
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
