import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './layouts/DashboardLayout';
import ErrorBoundary from './components/ErrorBoundary';

// Code-split route bundles
const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Departments = lazy(() => import('./pages/Departments'));
const Courses = lazy(() => import('./pages/Courses'));
const Students = lazy(() => import('./pages/Students'));
const Faculty = lazy(() => import('./pages/Faculty'));
const Attendance = lazy(() => import('./pages/Attendance'));
const Fees = lazy(() => import('./pages/Fees'));
const Exams = lazy(() => import('./pages/Exams'));
const Notices = lazy(() => import('./pages/Notices'));

// Institutional route loading skeleton
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="flex flex-col items-center gap-3">
      <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
        Loading View...
      </span>
    </div>
  </div>
);

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Public Login Route */}
              <Route path="/login" element={<Login />} />

              {/* Authenticated Dashboard Routes */}
              <Route element={<ProtectedRoute />}>
                <Route element={<DashboardLayout />}>
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route element={<ProtectedRoute allowedRoles={['admin', 'faculty', 'student']} />}>
                    <Route path="/courses" element={<Courses />} />
                  </Route>
                  <Route element={<ProtectedRoute allowedRoles={['admin', 'faculty', 'student']} />}>
                    <Route path="/attendance" element={<Attendance />} />
                    <Route path="/exams" element={<Exams />} />
                  </Route>
                  <Route path="/fees" element={<Fees />} />
                  <Route path="/notices" element={<Notices />} />
                  <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                    <Route path="/departments" element={<Departments />} />
                    <Route path="/faculty" element={<Faculty />} />
                  </Route>
                  <Route element={<ProtectedRoute allowedRoles={['admin', 'faculty', 'accountant']} />}>
                    <Route path="/students" element={<Students />} />
                  </Route>
                </Route>
              </Route>

              {/* Catch-all redirect */}
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}
