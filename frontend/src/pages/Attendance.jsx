import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import {
  CalendarCheck2,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  Save,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

export const Attendance = () => {
  const { user } = useAuth();
  const isStudent = user?.role === 'student';

  // State for faculty/admin
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [topicCovered, setTopicCovered] = useState('');
  const [students, setStudents] = useState([]);
  const [records, setRecords] = useState({}); // { [studentUserId]: 'Present' | 'Absent' | 'Late' }
  const [loading, setLoading] = useState(true);
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });

  // State for student view
  const [studentSummary, setStudentSummary] = useState(null);

  useEffect(() => {
    if (isStudent) {
      const fetchStudentSummary = async () => {
        try {
          const res = await api.get(`/attendance/student/${user._id}`);
          setStudentSummary(res.data.data);
        } catch (err) {
          console.error(err);
        } finally {
          setLoading(false);
        }
      };
      fetchStudentSummary();
    } else {
      const fetchCourses = async () => {
        try {
          const url = user?.role === 'faculty' ? `/academics/courses?faculty=${user._id}` : '/academics/courses';
          const res = await api.get(url);
          const courseList = res.data.data || [];
          setCourses(courseList);
          if (courseList.length > 0) setSelectedCourse(courseList[0]._id);
        } catch (err) {
          console.error(err);
        } finally {
          setLoading(false);
        }
      };
      fetchCourses();
    }
  }, [user]);

  // Auto-clear status message
  useEffect(() => {
    if (!statusMsg.text) return;
    const timer = setTimeout(() => setStatusMsg({ type: '', text: '' }), 4000);
    return () => clearTimeout(timer);
  }, [statusMsg]);

  // When selectedCourse changes, fetch students in that course's department and semester
  useEffect(() => {
    if (!isStudent && selectedCourse) {
      const courseObj = courses.find((c) => c._id === selectedCourse);
      if (courseObj) {
        const fetchStudentsForCourse = async () => {
          try {
            const res = await api.get(
              `/students?department=${courseObj.department?._id || courseObj.department}&semester=${courseObj.semester}`
            );
            const studentList = res.data.data || [];
            setStudents(studentList);

            // Default all students to 'Present'
            const initialRecs = {};
            studentList.forEach((st) => {
              initialRecs[st.user?._id] = 'Present';
            });
            setRecords(initialRecs);
          } catch (err) {
            console.error(err);
          }
        };
        fetchStudentsForCourse();
      }
    }
  }, [selectedCourse, courses, isStudent]);

  const handleStatusChange = (studentUserId, status) => {
    setRecords((prev) => ({ ...prev, [studentUserId]: status }));
  };

  const markAll = (status) => {
    const updated = {};
    students.forEach((st) => {
      updated[st.user?._id] = status;
    });
    setRecords(updated);
  };

  const handleSubmitAttendance = async (e) => {
    e.preventDefault();
    if (!selectedCourse) return;
    const courseObj = courses.find((c) => c._id === selectedCourse);

    const recordPayload = Object.keys(records).map((studentUserId) => ({
      student: studentUserId,
      status: records[studentUserId],
    }));

    try {
      await api.post('/attendance', {
        courseId: selectedCourse,
        departmentId: courseObj.department?._id || courseObj.department,
        semester: courseObj.semester,
        section: 'A',
        date: attendanceDate,
        topicCovered,
        records: recordPayload,
      });

      setStatusMsg({ type: 'success', text: `Attendance for ${courseObj.name} recorded successfully!` });
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.response?.data?.message || 'Failed to submit attendance' });
    }
  };

  // STUDENT VIEW
  if (isStudent) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Attendance Dossier</h1>
          <p className="text-sm text-slate-500 mt-1">Official lecture presence logs and semester eligibility status</p>
        </div>

        {studentSummary?.isShortage && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-rose-800">
            <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-sm">Attendance Alert (&lt; 75%)</h4>
              <p className="text-xs text-rose-700 mt-0.5">
                Your cumulative attendance is below 75%. You are at risk of debarment from semester final examinations.
              </p>
            </div>
          </div>
        )}

        {/* Overview Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Overall Rate</p>
              <h3 className={`text-3xl font-extrabold mt-1 ${studentSummary?.isShortage ? 'text-rose-600' : 'text-emerald-600'}`}>
                {studentSummary?.overallPercentage || 0}%
              </h3>
              <span className="text-xs text-slate-500 font-medium">University requirement: 75%</span>
            </div>
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${studentSummary?.isShortage ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
              <CalendarCheck2 className="w-7 h-7" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Present Classes</p>
              <h3 className="text-3xl font-extrabold text-slate-900 mt-1">{studentSummary?.overallPresent || 0}</h3>
              <span className="text-xs text-slate-500 font-medium">Attended sessions</span>
            </div>
            <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Sessions</p>
              <h3 className="text-3xl font-extrabold text-slate-900 mt-1">{studentSummary?.overallTotal || 0}</h3>
              <span className="text-xs text-slate-500 font-medium">Conducted lectures</span>
            </div>
            <div className="w-14 h-14 bg-slate-100 text-slate-600 rounded-2xl flex items-center justify-center">
              <BookOpen className="w-7 h-7" />
            </div>
          </div>
        </div>

        {/* Subject-Wise Breakdown Table */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h3 className="font-bold text-base text-slate-900">Subject-Wise Attendance Breakdown</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-4 px-6">Course</th>
                  <th className="py-4 px-6">Attended / Total</th>
                  <th className="py-4 px-6">Missed</th>
                  <th className="py-4 px-6">Percentage</th>
                  <th className="py-4 px-6">Eligibility</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {studentSummary?.breakdown?.length > 0 ? (
                  studentSummary.breakdown.map((item) => (
                    <tr key={item.courseId} className="hover:bg-slate-50/60">
                      <td className="py-4 px-6">
                        <span className="font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded text-[11px]">
                          {item.courseCode}
                        </span>
                        <span className="font-bold text-slate-800 ml-2">{item.courseName}</span>
                      </td>
                      <td className="py-4 px-6 font-semibold text-slate-700">
                        {item.present} / {item.total}
                      </td>
                      <td className="py-4 px-6 text-rose-600 font-semibold">
                        {item.absent}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <span className={`font-bold ${item.percentage < 75 ? 'text-rose-600' : 'text-emerald-600'}`}>
                            {item.percentage}%
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        {item.percentage >= 75 ? (
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase">
                            Eligible
                          </span>
                        ) : (
                          <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase">
                            Shortage Warning
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-slate-400 font-medium">
                      No attendance records logged for your courses yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // FACULTY & ADMIN ATTENDANCE MARKER VIEW
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Attendance Recording Portal</h1>
        <p className="text-sm text-slate-500 mt-1">Capture lecture session presence and real-time attendance logs</p>
      </div>

      {statusMsg.text && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold flex items-center gap-2 ${
            statusMsg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
          }`}
        >
          {statusMsg.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {statusMsg.text}
        </div>
      )}

      {/* Session Config Card */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
        <h3 className="font-bold text-base text-slate-800">Class Session Parameters</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Subject / Course</label>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              {courses.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.code} - {c.name} (Sem {c.semester})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Date</label>
            <input
              type="date"
              value={attendanceDate}
              onChange={(e) => setAttendanceDate(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Topic Covered</label>
            <input
              type="text"
              placeholder="e.g. Binary Search Trees & Rotations"
              value={topicCovered}
              onChange={(e) => setTopicCovered(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        </div>

        {/* Quick Batch Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <span className="text-xs font-medium text-slate-500">
            Enrolled Students: <strong className="text-slate-900">{students.length}</strong>
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => markAll('Present')}
              className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-semibold transition-colors"
            >
              Mark All Present
            </button>
            <button
              type="button"
              onClick={() => markAll('Absent')}
              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-semibold transition-colors"
            >
              Mark All Absent
            </button>
          </div>
        </div>
      </div>

      {/* Students Roll Call Table */}
      <form onSubmit={handleSubmitAttendance} className="space-y-4">
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-4 px-6">Roll No</th>
                  <th className="py-4 px-6">Student Name</th>
                  <th className="py-4 px-6">Enrollment No</th>
                  <th className="py-4 px-6 text-center">Attendance Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {students.length > 0 ? (
                  students.map((st) => {
                    const currentStatus = records[st.user?._id] || 'Present';
                    return (
                      <tr key={st._id} className="hover:bg-slate-50/60">
                        <td className="py-4 px-6 font-mono font-bold text-slate-700">
                          {st.rollNo}
                        </td>
                        <td className="py-4 px-6 font-bold text-slate-900">
                          {st.user?.name}
                        </td>
                        <td className="py-4 px-6 text-slate-500 font-mono">
                          {st.enrollmentNo}
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleStatusChange(st.user?._id, 'Present')}
                              className={`px-3 py-1 rounded-lg font-semibold text-xs transition-all ${
                                currentStatus === 'Present'
                                  ? 'bg-emerald-600 text-white shadow-sm'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              Present
                            </button>
                            <button
                              type="button"
                              onClick={() => handleStatusChange(st.user?._id, 'Absent')}
                              className={`px-3 py-1 rounded-lg font-semibold text-xs transition-all ${
                                currentStatus === 'Absent'
                                  ? 'bg-rose-600 text-white shadow-sm'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              Absent
                            </button>
                            <button
                              type="button"
                              onClick={() => handleStatusChange(st.user?._id, 'Late')}
                              className={`px-3 py-1 rounded-lg font-semibold text-xs transition-all ${
                                currentStatus === 'Late'
                                  ? 'bg-amber-600 text-white shadow-sm'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              Late
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="4" className="py-8 text-center text-slate-400 font-medium">
                      No students enrolled in this course's department and semester.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {students.length > 0 && (
          <div className="flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-3 rounded-xl text-sm shadow-lg shadow-indigo-100 transition-colors"
            >
              <Save className="w-4 h-4" /> Save Class Attendance
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default Attendance;
