import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { X, User, Lock, Mail, Phone, Building2, GraduationCap, CheckCircle, AlertCircle, Shield, KeyRound } from 'lucide-react';

export const ProfileModal = ({ isOpen, onClose }) => {
  const { user, updateToken } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);

  if (!isOpen || !user) return null;

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setStatusMsg({ type: '', text: '' });

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      return setStatusMsg({ type: 'error', text: 'New password and confirmation do not match.' });
    }
    if (passwordData.newPassword.length < 6) {
      return setStatusMsg({ type: 'error', text: 'Password must be at least 6 characters.' });
    }

    setLoading(true);
    try {
      const res = await api.put('/auth/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      // Synchronize newly returned JWT token with updated tokenVersion
      if (res.data?.token) {
        if (updateToken) {
          updateToken(res.data.token);
        } else {
          localStorage.setItem('erp_token', res.data.token);
        }
      }

      setStatusMsg({ type: 'success', text: 'Password updated successfully!' });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.response?.data?.message || 'Failed to update password.' });
    } finally {
      setLoading(false);
    }
  };

  const profile = user.profile || {};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-700 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white font-bold text-xl ring-2 ring-white/30">
              {user.name?.charAt(0) || 'U'}
            </div>
            <div>
              <h2 className="text-xl font-bold">{user.name}</h2>
              <p className="text-xs text-indigo-100 flex items-center gap-1.5 mt-0.5">
                <Shield className="w-3.5 h-3.5" />
                <span className="capitalize">{user.role}</span> • Institutional Member
              </p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-100 px-6 bg-slate-50">
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'profile'
                ? 'border-indigo-600 text-indigo-600 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <User className="w-3.5 h-3.5" /> Profile Details
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`py-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'security'
                ? 'border-indigo-600 text-indigo-600 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" /> Security & Password
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {statusMsg.text && (
            <div
              className={`p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 mb-4 ${
                statusMsg.type === 'success'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}
            >
              {statusMsg.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              {statusMsg.text}
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 font-semibold block text-[10px] uppercase">Email Address</span>
                  <span className="font-bold text-slate-800 flex items-center gap-1.5 mt-1 truncate">
                    <Mail className="w-3.5 h-3.5 text-indigo-600" /> {user.email}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 font-semibold block text-[10px] uppercase">Phone</span>
                  <span className="font-bold text-slate-800 flex items-center gap-1.5 mt-1">
                    <Phone className="w-3.5 h-3.5 text-indigo-600" /> {user.phone || 'Not Registered'}
                  </span>
                </div>
              </div>

              {/* Student Dossier */}
              {user.role === 'student' && (
                <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 space-y-2.5">
                  <div className="flex items-center gap-2 text-indigo-900 font-bold text-sm">
                    <GraduationCap className="w-4 h-4 text-indigo-600" /> Student Credentials
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-slate-700">
                    <div>
                      <span className="text-[10px] text-slate-500 font-semibold">Roll Number:</span>
                      <p className="font-bold font-mono">{profile.rollNo || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-semibold">Enrollment ID:</span>
                      <p className="font-bold font-mono text-indigo-700">{profile.enrollmentNo || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-semibold">Department:</span>
                      <p className="font-bold">{profile.department?.name || 'Assigned Dept'}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-semibold">Semester & Section:</span>
                      <p className="font-bold">Semester {profile.semester || 1} (Sec {profile.section || 'A'})</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Faculty Dossier */}
              {user.role === 'faculty' && (
                <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-100 space-y-2.5">
                  <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                    <Building2 className="w-4 h-4 text-amber-600" /> Faculty Dossier
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-slate-700">
                    <div>
                      <span className="text-[10px] text-slate-500 font-semibold">Employee ID:</span>
                      <p className="font-bold font-mono">{profile.employeeId || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-semibold">Designation:</span>
                      <p className="font-bold text-indigo-700">{profile.designation || 'Instructor'}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-semibold">Department:</span>
                      <p className="font-bold">{profile.department?.name || 'Department'}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-semibold">Office Location:</span>
                      <p className="font-bold">{profile.officeRoom || 'Faculty Wing'}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-slate-500 text-[11px] flex items-center justify-between">
                <span>Account Status:</span>
                <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Active & Verified
                </span>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Current Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    placeholder="Enter current password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">New Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    placeholder="Minimum 6 characters"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Confirm New Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    placeholder="Re-type new password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs shadow-md shadow-indigo-100 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;
