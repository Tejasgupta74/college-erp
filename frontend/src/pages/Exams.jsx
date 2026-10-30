import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Award, Plus, Edit, Save, CheckCircle, AlertCircle, Printer } from 'lucide-react';
import TranscriptModal from '../components/TranscriptModal';

const initialExamForm = {
  title: '',
  courseId: '',
  departmentId: '',
  semester: 1,
  examType: 'Internal/Mid-Term',
  maxMarks: 50,
  passingMarks: 20,
  examDate: new Date().toISOString().split('T')[0],
};

export const Exams = () => {
  const { user } = useAuth();
  const isStudent = user?.role === 'student';
  const isFacultyOrAdmin = user?.role === 'faculty' || user?.role === 'admin';

  // Student state
  const [reportCard, setReportCard] = useState([]);
  const [showTranscriptModal, setShowTranscriptModal] = useState(false);

  // Faculty/Admin state
  const [exams, setExams] = useState([]);
  const [courses, setCourses] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  // Modals / Marks entry
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [examForm, setExamForm] = useState(initialExamForm);

  const [activeExamForMarks, setActiveExamForMarks] = useState(null);
  const [marksEntries, setMarksEntries] = useState([]); // [{ studentId, name, rollNo, marksObtained, remarks }]
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });

  const fetchData = async (signal) => {
    setLoading(true);
    try {
      if (isStudent) {
        const res = await api.get(`/exams/report-card/${user._id}`, { signal });
        setReportCard(res.data.data || []);
      } else {
        const [examRes, courseRes, deptRes] = await Promise.all([
          api.get(`/exams?page=${page}&limit=20`, { signal }),
          api.get('/academics/courses', { signal }),
          api.get('/academics/departments', { signal }),
        ]);

        setExams(examRes.data.data || []);
        setPagination({
          page: examRes.data.page || 1,
          pages: examRes.data.pages || 1,
          total: examRes.data.total || (examRes.data.data || []).length,
        });
        setCourses(courseRes.data.data || []);
        setDepartments(deptRes.data.data || []);
      }
    } catch (err) {
      if (err.code !== 'ERR_CANCELED') {
        console.error(err);
        setStatusMsg({ type: 'error', text: 'Failed to load examinations.' });
      }
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchData(controller.signal);
    return () => controller.abort();
  }, [user, page]);

  useEffect(() => {
    if (!statusMsg.text) return;
    const timer = setTimeout(() => setStatusMsg({ type: '', text: '' }), 4000);
    return () => clearTimeout(timer);
  }, [statusMsg]);

  const handleCreateExam = async (e) => {
    e.preventDefault();
    try {
      await api.post('/exams', examForm);
      setStatusMsg({ type: 'success', text: 'Exam scheduled successfully!' });
      setShowCreateModal(false);
      setExamForm(initialExamForm);
      fetchData();
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.response?.data?.message || 'Failed to schedule exam' });
    }
  };

  const handleOpenMarksEntry = async (exam) => {
    setActiveExamForMarks(exam);
    try {
      // Fetch entire enrolled student cohort for this course & department
      const res = await api.get(
        `/students/roster?department=${exam.department?._id || exam.department}&semester=${exam.semester}`
      );
      const studentList = res.data.data || [];

      // Merge with existing exam results if already recorded, leaving unentered rows empty (not 0)
      const entries = studentList.map((st) => {
        const existingResult = exam.results?.find(
          (r) => (r.student?._id || r.student)?.toString() === st.user?._id?.toString()
        );
        return {
          studentId: st.user?._id,
          name: st.user?.name,
          rollNo: st.rollNo,
          marksObtained: existingResult != null && existingResult.marksObtained !== undefined ? existingResult.marksObtained : '',
          remarks: existingResult ? existingResult.remarks : '',
        };
      });

      setMarksEntries(entries);
    } catch (err) {
      console.error(err);
      setStatusMsg({ type: 'error', text: 'Failed to load student roster for this examination.' });
    }
  };

  const handleSaveMarks = async (e) => {
    e.preventDefault();
    if (!activeExamForMarks) return;

    // Filter to only rows that were actively filled in so unentered/absent students aren't failed with 0
    const filledEntries = marksEntries
      .filter((entry) => entry.marksObtained !== '' && entry.marksObtained !== null && entry.marksObtained !== undefined)
      .map((entry) => ({
        ...entry,
        marksObtained: Number(entry.marksObtained),
      }));

    if (filledEntries.length === 0) {
      setStatusMsg({ type: 'error', text: 'Please enter marks for at least one student before saving.' });
      return;
    }

    try {
      await api.post(`/exams/${activeExamForMarks._id}/marks`, {
        results: filledEntries,
      });

      setStatusMsg({ type: 'success', text: `Marks for ${activeExamForMarks.title} submitted successfully!` });
      setActiveExamForMarks(null);
      fetchData();
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.response?.data?.message || 'Failed to submit marks' });
    }
  };

  // STUDENT VIEW - OFFICIAL REPORT CARD
  if (isStudent) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Academic Grade Card</h1>
          <p className="text-sm text-slate-500 mt-1">Official semester transcripts, course grades, and evaluation records</p>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-slate-900">Term Evaluation Matrix</h3>
              <p className="text-xs text-slate-500 mt-0.5">Continuous assessment and final semester scores</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowTranscriptModal(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
              >
                <Printer className="w-3.5 h-3.5" /> Print Transcript
              </button>
              <span className="text-xs font-semibold bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-xl border border-emerald-200">
                Active Transcript
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-4 px-6">Course</th>
                  <th className="py-4 px-6">Exam Title</th>
                  <th className="py-4 px-6">Score</th>
                  <th className="py-4 px-6">Percentage</th>
                  <th className="py-4 px-6">Grade</th>
                  <th className="py-4 px-6">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {reportCard.length > 0 ? (
                  reportCard.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/60">
                      <td className="py-4 px-6">
                        <span className="font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded text-[11px]">
                          {item.courseCode}
                        </span>
                        <span className="font-bold text-slate-800 ml-2">{item.courseName}</span>
                      </td>
                      <td className="py-4 px-6 font-semibold text-slate-700">
                        {item.examTitle} ({item.examType})
                      </td>
                      <td className="py-4 px-6 font-bold text-slate-900">
                        {item.marksObtained} / {item.maxMarks}
                      </td>
                      <td className="py-4 px-6 font-semibold text-slate-600">
                        {item.percentage}%
                      </td>
                      <td className="py-4 px-6">
                        <span className="font-extrabold text-sm text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg">
                          {item.grade}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        {item.isPassed ? (
                          <span className="text-emerald-700 font-bold bg-emerald-100 text-[10px] px-2.5 py-1 rounded-full uppercase tracking-wider">
                            Passed
                          </span>
                        ) : (
                          <span className="text-rose-700 font-bold bg-rose-100 text-[10px] px-2.5 py-1 rounded-full uppercase tracking-wider">
                            Backlog / Re-exam
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-slate-400 font-medium">
                      No examination results published yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Printable Transcript Modal */}
        <TranscriptModal
          isOpen={showTranscriptModal}
          onClose={() => setShowTranscriptModal(false)}
          reportCard={reportCard}
          studentProfile={user?.profile}
          userName={user?.name}
        />
      </div>
    );
  }

  // FACULTY & ADMIN VIEW
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Examinations & Grade Controller</h1>
          <p className="text-sm text-slate-500 mt-1">Schedule exams, record marks, and publish semester results</p>
        </div>

        {isFacultyOrAdmin && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2.5 rounded-xl text-sm shadow-md shadow-indigo-100 transition-colors"
          >
            <Plus className="w-4 h-4" /> Schedule New Exam
          </button>
        )}
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

      {/* Marks Entry Overlay / Card */}
      {activeExamForMarks && (
        <div className="bg-white p-6 rounded-3xl border-2 border-indigo-500 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-lg text-slate-900">
                Grade Entry: {activeExamForMarks.title}
              </h3>
              <p className="text-xs text-slate-500">
                Course: {activeExamForMarks.course?.code} - {activeExamForMarks.course?.name} • Max Marks: {activeExamForMarks.maxMarks}
              </p>
            </div>
            <button
              onClick={() => setActiveExamForMarks(null)}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 px-3 py-1.5 rounded-lg border border-slate-200"
            >
              Close
            </button>
          </div>

          <form onSubmit={handleSaveMarks} className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[11px]">
                    <th className="p-3">Roll No</th>
                    <th className="p-3">Student Name</th>
                    <th className="p-3">Marks Obtained (Max: {activeExamForMarks.maxMarks})</th>
                    <th className="p-3">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {marksEntries.map((entry, idx) => (
                    <tr key={entry.studentId} className="hover:bg-slate-50/50">
                      <td className="p-3 font-mono font-bold text-slate-700">{entry.rollNo}</td>
                      <td className="p-3 font-semibold text-slate-900">{entry.name}</td>
                      <td className="p-3">
                        <input
                          type="number"
                          min="0"
                          max={activeExamForMarks.maxMarks}
                          placeholder="Unentered"
                          value={entry.marksObtained}
                          onChange={(e) => {
                            const updated = [...marksEntries];
                            updated[idx].marksObtained = e.target.value === '' ? '' : e.target.value;
                            setMarksEntries(updated);
                          }}
                          className="w-24 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-indigo-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        />
                      </td>
                      <td className="p-3">
                        <input
                          type="text"
                          placeholder="Optional comments..."
                          value={entry.remarks}
                          onChange={(e) => {
                            const updated = [...marksEntries];
                            updated[idx].remarks = e.target.value;
                            setMarksEntries(updated);
                          }}
                          className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-5 py-2.5 rounded-xl text-xs shadow-md shadow-indigo-100 transition-colors"
              >
                <Save className="w-4 h-4" /> Save & Compute Grades
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Scheduled Exams Table */}
      {loading ? (
        <div className="flex justify-center p-12">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-4 px-6">Exam Title & Type</th>
                  <th className="py-4 px-6">Course</th>
                  <th className="py-4 px-6">Semester</th>
                  <th className="py-4 px-6">Max / Passing Marks</th>
                  <th className="py-4 px-6">Evaluated Students</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {exams.length > 0 ? (
                  exams.map((ex) => (
                    <tr key={ex._id} className="hover:bg-slate-50/60">
                      <td className="py-4 px-6">
                        <p className="font-bold text-slate-900 text-sm">{ex.title}</p>
                        <span className="text-[11px] text-slate-400 font-medium">
                          {ex.examType} • {new Date(ex.examDate).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span className="font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded text-[11px]">
                          {ex.course?.code}
                        </span>
                        <div className="text-slate-800 font-medium mt-0.5">{ex.course?.name}</div>
                      </td>
                      <td className="py-4 px-6 font-semibold text-slate-700">
                        Semester {ex.semester}
                      </td>
                      <td className="py-4 px-6 font-semibold text-slate-800">
                        {ex.maxMarks} / {ex.passingMarks}
                      </td>
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center gap-1 font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full text-[11px]">
                          <Award className="w-3.5 h-3.5" /> {ex.results?.length || 0} Graded
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => handleOpenMarksEntry(ex)}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm inline-flex items-center gap-1.5 transition-colors"
                        >
                          <Edit className="w-3.5 h-3.5" /> Enter Marks
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-slate-400 font-medium">
                      No examinations scheduled.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {pagination.pages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50">
              <p className="text-xs text-slate-500">
                Showing <span className="font-semibold text-slate-700">{((pagination.page - 1) * 20) + 1}</span> to{' '}
                <span className="font-semibold text-slate-700">{Math.min(pagination.page * 20, pagination.total)}</span> of{' '}
                <span className="font-semibold text-slate-700">{pagination.total}</span> examinations
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                  disabled={pagination.page <= 1}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <span className="text-xs font-semibold text-slate-600 px-2">
                  Page {pagination.page} of {pagination.pages}
                </span>
                <button
                  type="button"
                  onClick={() => setPage((prev) => Math.min(prev + 1, pagination.pages))}
                  disabled={pagination.page >= pagination.pages}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Schedule Exam Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl">
            <h3 className="font-bold text-lg text-slate-900 mb-1">Schedule Examination</h3>
            <p className="text-xs text-slate-500 mb-4">Set up an assessment for grading</p>

            <form onSubmit={handleCreateExam} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Exam Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mid-Term Examination Fall 2026"
                  value={examForm.title}
                  onChange={(e) => setExamForm({ ...examForm, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Subject / Course</label>
                <select
                  required
                  value={examForm.courseId}
                  onChange={(e) => {
                    const c = courses.find((item) => item._id === e.target.value);
                    setExamForm({
                      ...examForm,
                      courseId: e.target.value,
                      departmentId: c?.department?._id || '',
                      semester: c?.semester || 1,
                    });
                  }}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="">Select Course</option>
                  {courses.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.code} - {c.name} (Sem {c.semester})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Exam Type</label>
                  <select
                    value={examForm.examType}
                    onChange={(e) => setExamForm({ ...examForm, examType: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="Internal/Mid-Term">Internal / Mid-Term</option>
                    <option value="Final/End-Term">Final / End-Term</option>
                    <option value="Quiz/Assignment">Quiz / Assignment</option>
                    <option value="Practical/Lab">Practical / Lab Exam</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Exam Date</label>
                  <input
                    type="date"
                    required
                    value={examForm.examDate}
                    onChange={(e) => setExamForm({ ...examForm, examDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Max Marks</label>
                  <input
                    type="number"
                    required
                    min="10"
                    value={examForm.maxMarks}
                    onChange={(e) => setExamForm({ ...examForm, maxMarks: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Passing Marks</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={examForm.passingMarks}
                    onChange={(e) => setExamForm({ ...examForm, passingMarks: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs shadow-md shadow-indigo-100 transition-colors"
                >
                  Confirm Exam
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Exams;
