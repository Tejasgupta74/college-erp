import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api, { DEFAULT_BACKEND_URL } from '../api/axios';
import {
  GraduationCap,
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  UserCheck,
  BookOpen,
  CreditCard,
  CheckCircle2,
  Server,
  Settings,
  RefreshCw,
} from 'lucide-react';

export const Login = () => {
  // Modes: 'signin' | 'forgot'
  const [isForgot, setIsForgot] = useState(false);

  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Backend API URL Configuration
  const [showApiConfig, setShowApiConfig] = useState(false);
  const [customApiUrl, setCustomApiUrl] = useState(
    () => localStorage.getItem('erp_api_url') || import.meta.env.VITE_API_URL || DEFAULT_BACKEND_URL
  );
  const [apiTesting, setApiTesting] = useState(false);
  const [apiStatus, setApiStatus] = useState(null); // { online: boolean, message: string }

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleTestApi = async (url) => {
    setApiTesting(true);
    setApiStatus(null);
    try {
      const target = (url || customApiUrl || '').trim();
      const withProto = target.startsWith('http://') || target.startsWith('https://')
        ? target
        : target ? `https://${target}` : window.location.origin;
      const endpoint = `${withProto.replace(/\/$/, '')}/api/health`;

      const res = await fetch(endpoint);
      const data = await res.json();
      if (data.status === 'online') {
        setApiStatus({ online: true, message: `Connected to ${data.system || 'API'} (Database: ${data.database})` });
        return true;
      }
      setApiStatus({ online: false, message: 'Server responded, but status is degraded.' });
      return false;
    } catch (err) {
      setApiStatus({ online: false, message: 'Cannot reach server: ' + err.message });
      return false;
    } finally {
      setApiTesting(false);
    }
  };

  const handleSaveApiUrl = () => {
    const trimmed = customApiUrl.trim();
    if (trimmed) {
      const formatted = trimmed.startsWith('http://') || trimmed.startsWith('https://') ? trimmed : `https://${trimmed}`;
      localStorage.setItem('erp_api_url', formatted);
      setCustomApiUrl(formatted);
      setSuccess('Backend API URL saved! Testing connection...');
      handleTestApi(formatted);
    } else {
      localStorage.removeItem('erp_api_url');
      setSuccess('Reset API URL to default.');
    }
  };

  // Sign In Handler
  const handleSignIn = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      if (err.isHtmlResponse || err.message?.includes('Backend API not reached')) {
        setError('Backend API is not reached. Please verify your Render Backend URL below.');
        setShowApiConfig(true);
      } else {
        setError(err.response?.data?.message || err.message || 'Invalid institutional credentials');
      }
    } finally {
      setLoading(false);
    }
  };

  // Direct Password Reset Handler (No token generation or entry)
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/reset-password', {
        email,
        newPassword,
      });
      setSuccess(res.data?.message || 'Password reset successfully! You can now sign in.');
      setPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setIsForgot(false);
    } catch (err) {
      if (err.isHtmlResponse || err.message?.includes('Backend API not reached')) {
        setError('Backend API is not reached. Please verify your Render Backend URL below.');
        setShowApiConfig(true);
      } else {
        setError(err.response?.data?.message || 'Failed to reset password. Please verify your email.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError('');
    setLoading(true);
    try {
      await login(demoEmail, demoPass);
      navigate('/dashboard');
    } catch (err) {
      if (err.isHtmlResponse || err.message?.includes('Backend API not reached')) {
        setError('Backend API is not reachable. Please connect your Render Backend Web Service below.');
        setShowApiConfig(true);
      } else {
        setError(err.response?.data?.message || 'Quick login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-indigo-50 to-slate-200 flex items-center justify-center p-4 py-8">
      <div className="max-w-md w-full">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-600 text-white shadow-xl shadow-indigo-200 mb-3">
            <GraduationCap className="w-9 h-9" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">College ERP System</h1>
          <p className="text-sm text-slate-500 mt-0.5 font-medium">Enterprise Resource Planning Portal</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-100 p-8">
          {/* Header Info */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-800">
                {isForgot ? 'Reset Password' : 'Sign in to your account'}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {isForgot
                  ? 'Enter your institutional email and set your new password directly'
                  : 'Enter your institutional credentials to continue'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setIsForgot(!isForgot);
                setError('');
                setSuccess('');
              }}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              {isForgot ? '← Back to Login' : 'Forgot?'}
            </button>
          </div>

          {/* Feedback Alerts */}
          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-600 flex-shrink-0"></span>
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* SIGN IN FORM */}
          {!isForgot ? (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Institutional Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@college.edu"
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm shadow-md shadow-indigo-200 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* DIRECT PASSWORD RESET FORM (No token required) */
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Registered Institutional Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@college.edu"
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm shadow-md shadow-emerald-200 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <span>Reset Password</span>
                )}
              </button>
            </form>
          )}

          {/* Quick Demo Logins Section */}
          {!isForgot && import.meta.env.VITE_HIDE_DEMO !== 'true' && (
            <div className="mt-8 pt-6 border-t border-slate-100">
              <p className="text-xs font-semibold text-slate-500 text-center uppercase tracking-wider mb-3">
                ⚡ Demo 1-Click Access
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => handleQuickLogin('admin@college.edu', 'Admin@123')}
                  className="p-2.5 border border-rose-200 bg-rose-50/50 hover:bg-rose-100/70 text-rose-800 rounded-xl font-medium flex items-center gap-2 transition-colors text-left"
                >
                  <ShieldCheck className="w-4 h-4 text-rose-600 flex-shrink-0" />
                  <div className="truncate">
                    <div className="font-bold">Super Admin</div>
                    <div className="text-[10px] text-rose-600">admin@college.edu</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickLogin('prof.sharma@college.edu', 'Faculty@123')}
                  className="p-2.5 border border-amber-200 bg-amber-50/50 hover:bg-amber-100/70 text-amber-800 rounded-xl font-medium flex items-center gap-2 transition-colors text-left"
                >
                  <BookOpen className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <div className="truncate">
                    <div className="font-bold">Faculty (HOD)</div>
                    <div className="text-[10px] text-amber-600">prof.sharma@...</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickLogin('student@college.edu', 'Student@123')}
                  className="p-2.5 border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100/70 text-emerald-800 rounded-xl font-medium flex items-center gap-2 transition-colors text-left"
                >
                  <UserCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <div className="truncate">
                    <div className="font-bold">Student</div>
                    <div className="text-[10px] text-emerald-600">student@college.edu</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickLogin('accountant@college.edu', 'Accountant@123')}
                  className="p-2.5 border border-blue-200 bg-blue-50/50 hover:bg-blue-100/70 text-blue-800 rounded-xl font-medium flex items-center gap-2 transition-colors text-left"
                >
                  <CreditCard className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <div className="truncate">
                    <div className="font-bold">Accounts Officer</div>
                    <div className="text-[10px] text-blue-600">accountant@...</div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Backend Connection Config Drawer */}
          <div className="mt-6 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowApiConfig(!showApiConfig)}
              className="w-full text-center text-xs text-slate-500 hover:text-slate-800 font-medium flex items-center justify-center gap-1.5 transition-colors"
            >
              <Settings className="w-3.5 h-3.5 text-slate-400" />
              <span>{showApiConfig ? 'Hide Backend Server Settings' : 'Configure Backend API Server'}</span>
            </button>

            {showApiConfig && (
              <div className="mt-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Render Backend Web Service URL
                  </label>
                  <input
                    type="url"
                    value={customApiUrl}
                    onChange={(e) => setCustomApiUrl(e.target.value)}
                    placeholder="https://your-backend.onrender.com"
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Paste the URL of your deployed Render backend web service here.
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleSaveApiUrl}
                    className="flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold text-xs transition-colors"
                  >
                    Save & Apply
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTestApi(customApiUrl)}
                    disabled={apiTesting}
                    className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg font-semibold text-xs flex items-center gap-1 transition-colors"
                  >
                    <RefreshCw className={`w-3 h-3 ${apiTesting ? 'animate-spin' : ''}`} />
                    <span>Test</span>
                  </button>
                </div>

                {apiStatus && (
                  <div
                    className={`p-2 rounded-lg text-[11px] font-medium ${
                      apiStatus.online
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-rose-50 text-rose-800 border border-rose-200'
                    }`}
                  >
                    {apiStatus.online ? '🟢 ' : '🔴 '}
                    {apiStatus.message}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6 font-medium">
          Protected by Institutional Single Sign-On & JWT Encryption
        </p>
      </div>
    </div>
  );
};

export default Login;
