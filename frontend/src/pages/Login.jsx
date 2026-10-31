import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
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
} from 'lucide-react';

export const Login = () => {
  // Modes: 'signin' | 'forgot'
  const [isForgot, setIsForgot] = useState(false);
  const [resetStep, setResetStep] = useState(1); // 1 = request token, 2 = enter token & new password
  const [resetToken, setResetToken] = useState('');

  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

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
      if (err.isHtmlResponse || (!err.response && !err.status)) {
        setError('Backend server is spinning up (free tier cold start). Please wait ~30 seconds and try again.');
      } else {
        setError(err.response?.data?.message || err.message || 'Invalid institutional credentials');
      }
    } finally {
      setLoading(false);
    }
  };

  // Step 1: Request Password Reset Token
  const handleRequestResetToken = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await api.post('/auth/forgot-password', { email });
      setSuccess(res.data?.message || 'Password reset instructions have been generated.');
      if (res.data?.resetToken) {
        setResetToken(res.data.resetToken);
      }
      setResetStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to request reset token. Please check your email.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Submit Token & Set New Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!resetToken.trim()) {
      setError('Please provide the password reset token');
      return;
    }

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
        token: resetToken.trim(),
        newPassword,
      });
      setSuccess(res.data?.message || 'Password reset successfully! You can now sign in.');
      setPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setResetToken('');
      setResetStep(1);
      setIsForgot(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired password reset token.');
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
      if (err.isHtmlResponse || (!err.response && !err.status)) {
        setError('Backend server is spinning up (free tier cold start). Please wait ~30 seconds and try again.');
      } else {
        setError(err.response?.data?.message || 'Quick login failed. Please verify credentials.');
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
                {isForgot ? (resetStep === 1 ? 'Forgot Password' : 'Set New Password') : 'Sign in to your account'}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {isForgot
                  ? (resetStep === 1
                      ? 'Enter your institutional email to request a secure reset token'
                      : 'Enter the verification token and your new password')
                  : 'Enter your institutional credentials to continue'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setIsForgot(!isForgot);
                setResetStep(1);
                setResetToken('');
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
          ) : resetStep === 1 ? (
            /* SECURE PASSWORD RESET - STEP 1 (REQUEST TOKEN) */
            <form onSubmit={handleRequestResetToken} className="space-y-4">
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
                <p className="text-[11px] text-slate-400 mt-1">
                  A 15-minute cryptographically secure reset token will be issued for this account.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm shadow-md shadow-indigo-200 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <span>Request Reset Token</span>
                )}
              </button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => setResetStep(2)}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
                >
                  Already have an administrator reset token? Click here
                </button>
              </div>
            </form>
          ) : (
            /* SECURE PASSWORD RESET - STEP 2 (ENTER TOKEN & SET PASSWORD) */
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Reset Token
                </label>
                <input
                  type="text"
                  value={resetToken}
                  onChange={(e) => setResetToken(e.target.value)}
                  placeholder="Paste 64-character hex token"
                  required
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                />
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

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setResetStep(1)}
                  className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors"
                >
                  ← Resend
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm shadow-md shadow-emerald-200 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <span>Set New Password</span>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Quick Demo Logins Section - accessible for evaluation */}
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
        </div>

        <p className="text-center text-xs text-slate-400 mt-6 font-medium">
          Protected by Institutional Single Sign-On & JWT Encryption
        </p>
      </div>
    </div>
  );
};

export default Login;
