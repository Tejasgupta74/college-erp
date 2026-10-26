import { useState, useEffect } from 'react';
import api from '../api/axios';
import {
  X,
  Mail,
  Phone,
  Building2,
  CalendarCheck2,
  CreditCard,
  Award,
  MapPin,
  Heart,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  BookOpen
} from 'lucide-react';

export const StudentDossierModal = ({ isOpen, onClose, studentId }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen || !studentId) return;

    const fetchDetails = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/students/${studentId}`);
        setData(res.data.data);
      } catch (err) {
        console.error('Failed to fetch student details', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [isOpen, studentId]);

  if (!isOpen) return null;

  const profile = data?.profile;
  const user = profile?.user;
  const attendance = data?.attendanceStats;
  const fees = data?.fees || [];
  const examResults = data?.examResults || [];

  let totalBilled = 0;
  let totalPaid = 0;
  fees.forEach((f) => {
    totalBilled += f.totalAmount || 0;
    totalPaid += f.paidAmount || 0;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-indigo-700 via-indigo-600 to-violet-600 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white font-extrabold text-2xl ring-2 ring-white/30">
              {user?.name?.charAt(0) || 'S'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold">{user?.name || 'Student Name'}</h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-200 border border-emerald-400/30 text-[10px] font-bold uppercase">
                  Enrolled
                </span>
              </div>
              <p className="text-xs text-indigo-100 mt-0.5">
                Roll: <span className="font-mono font-bold text-white">{profile?.rollNo}</span> • Enrollment: <span className="font-mono text-white">{profile?.enrollmentNo}</span>
              </p>
              <p className="text-xs text-indigo-200 mt-1">
                {profile?.department?.name} ({profile?.department?.code}) • Semester {profile?.semester} (Sec {profile?.section})
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-800">
          {loading ? (
            <div className="py-12 flex justify-center">
              <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <>
              {/* Core Academic KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Attendance */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Attendance Rate</span>
                    <span className={`text-xl font-extrabold mt-0.5 block ${attendance?.attendancePercentage < 75 ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {attendance?.attendancePercentage || 0}%
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium">
                      {attendance?.presentClasses || 0}/{attendance?.totalClasses || 0} Sessions
                    </span>
                  </div>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${attendance?.attendancePercentage < 75 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                    <CalendarCheck2 className="w-5 h-5" />
                  </div>
                </div>

                {/* Fee Status */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Fee Balance</span>
                    <span className="text-xl font-extrabold text-slate-900 mt-0.5 block">
                      ₹{(totalBilled - totalPaid).toLocaleString()}
                    </span>
                    <span className="text-[11px] text-emerald-600 font-semibold">
                      ₹{totalPaid.toLocaleString()} Paid
                    </span>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                    <CreditCard className="w-5 h-5" />
                  </div>
                </div>

                {/* Batch & Program */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Academic Cohort</span>
                    <span className="text-base font-bold text-slate-800 mt-0.5 block">{profile?.batchYear}</span>
                    <span className="text-[11px] text-indigo-600 font-semibold">Semester {profile?.semester}</span>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <BookOpen className="w-5 h-5" />
                  </div>
                </div>
              </div>

              {/* Contact & Personal Information */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">Personal & Guardian Contacts</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Email Contact</span>
                    <p className="font-semibold text-slate-800 flex items-center gap-1.5 truncate">
                      <Mail className="w-3.5 h-3.5 text-indigo-600" /> {user?.email}
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Phone</span>
                    <p className="font-semibold text-slate-800 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-indigo-600" /> {user?.phone || 'Not recorded'}
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Guardian Details</span>
                    <p className="font-bold text-slate-800">{profile?.guardianName || 'Guardian'}</p>
                    <p className="text-slate-500 flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-400" /> {profile?.guardianPhone || 'No contact'}
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Residential Address</span>
                    <p className="text-slate-700 flex items-start gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0 mt-0.5" />
                      <span>{profile?.address || 'On Campus / Hostel'}</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Recent Examination Performance */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">Examination Scores</h4>
                {examResults.length > 0 ? (
                  <div className="rounded-xl border border-slate-200 overflow-hidden text-xs">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
                        <tr>
                          <th className="py-2 px-3">Subject</th>
                          <th className="py-2 px-3">Exam</th>
                          <th className="py-2 px-3 text-center">Score</th>
                          <th className="py-2 px-3 text-center">Grade</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {examResults.map((ex, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="py-2 px-3 font-semibold text-slate-800">
                              <span className="font-mono text-indigo-600 mr-1.5 font-bold">{ex.course?.code}</span>
                              {ex.course?.name}
                            </td>
                            <td className="py-2 px-3 text-slate-600">{ex.examTitle}</td>
                            <td className="py-2 px-3 text-center font-bold text-slate-900">{ex.marksObtained}/{ex.maxMarks}</td>
                            <td className="py-2 px-3 text-center">
                              <span className="font-extrabold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded text-[11px]">
                                {ex.grade}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">No examination results published yet.</p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentDossierModal;
