import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Plus, Search, Mail, CheckCircle, AlertCircle, Eye, Download, FileSpreadsheet } from 'lucide-react';
import StudentDossierModal from '../components/StudentDossierModal';
import { exportToExcel, exportToCSV } from '../utils/exportUtils';

const initialStudentForm = {
  name: '',
  email: '',
  password: '',
  phone: '',
  departmentId: '',
  semester: 1,
  section: 'A',
  batchYear: '2024-2028',
  guardianName: '',
  guardianPhone: '',
};

export const Students = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedSem, setSelectedSem] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [showModal, setShowModal] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [showDossierModal, setShowDossierModal] = useState(false);
  const [formData, setFormData] = useState(initialStudentForm);
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });
  const [fetchError, setFetchError] = useState(null);
  const [exporting, setExporting] = useState(false);

  // 300ms debounce for search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  const fetchStudents = useCallback(async (signal) => {
    setLoading(true);
    setFetchError(null);
    try {
      let url = `/students?page=${page}&limit=20&`;
      if (debouncedSearch.trim()) url += `search=${encodeURIComponent(debouncedSearch.trim())}&`;
      if (selectedDept) url += `department=${selectedDept}&`;
      if (selectedSem) url += `semester=${selectedSem}&`;

      const [res, deptRes] = await Promise.all([
        api.get(url, { signal }),
        api.get('/academics/departments', { signal }),
      ]);

      setStudents(res.data.data || []);
      setPagination({
        page: res.data.page || 1,
        pages: res.data.pages || 1,
        total: res.data.total || (res.data.data || []).length,
      });
      setDepartments(deptRes.data.data || []);
    } catch (err) {
      if (err.code !== 'ERR_CANCELED') {
        console.error(err);
        setFetchError('Failed to load students directory. Please verify connection and try again.');
      }
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [page, debouncedSearch, selectedDept, selectedSem]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, selectedDept, selectedSem]);

  useEffect(() => {
    const controller = new AbortController();
    fetchStudents(controller.signal);
    return () => controller.abort();
  }, [fetchStudents]);

  useEffect(() => {
    if (!statusMsg.text) return;
    const timer = setTimeout(() => setStatusMsg({ type: '', text: '' }), 4000);
    return () => clearTimeout(timer);
  }, [statusMsg]);

  const handleCreateStudent = async (e) => {
    e.preventDefault();
    try {
      await api.post('/auth/create-user', { ...formData, role: 'student' });
      setStatusMsg({ type: 'success', text: 'Student admitted and enrolled successfully' });
      setShowModal(false);
      setFormData(initialStudentForm);
      fetchStudents();
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.response?.data?.message || 'Failed to enroll student' });
    }
  };

  const handleExportData = async (format) => {
    setExporting(true);
    try {
      let url = `/students?all=true&`;
      if (debouncedSearch.trim()) url += `search=${encodeURIComponent(debouncedSearch.trim())}&`;
      if (selectedDept) url += `department=${selectedDept}&`;
      if (selectedSem) url += `semester=${selectedSem}&`;

      const res = await api.get(url);
      const records = res.data.data || [];
      if (!records.length) {
        setStatusMsg({ type: 'error', text: 'No student records available to export.' });
        return;
      }

      const formattedData = records.map((s, idx) => ({
        'S.No': idx + 1,
        'Name': s.user?.name || 'N/A',
        'Roll Number': s.rollNo || 'N/A',
        'Enrollment': s.enrollmentNo || 'N/A',
        'Department': s.department?.name || 'N/A',
        'Semester': s.semester || 'N/A',
        'Section': s.section || 'A',
        'Email': s.user?.email || 'N/A',
        'Phone': s.user?.phone || 'N/A',
        'Batch Year': s.batchYear || 'N/A',
        'Guardian Name': s.guardianName || 'N/A',
      }));

      const filename = `Students_Export_${new Date().toISOString().slice(0, 10)}`;
      if (format === 'csv') {
        exportToCSV(formattedData, filename);
      } else {
        exportToExcel(formattedData, filename, 'Students Directory');
      }
    } catch (err) {
      console.error(err);
      setStatusMsg({ type: 'error', text: 'Export failed. Could not fetch all student records.' });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Student Directory</h1>
          <p className="text-sm text-slate-500 mt-1">Enrollment dossiers, academic tracking, and student information</p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => handleExportData('xlsx')}
            disabled={exporting || loading || pagination.total === 0}
            className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-3 py-2 rounded-xl text-xs shadow-sm transition-colors disabled:opacity-50"
            title="Export all matching students as Excel"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" /> {exporting ? 'Exporting...' : 'Export Excel'}
          </button>
          <button
            onClick={() => handleExportData('csv')}
            disabled={exporting || loading || pagination.total === 0}
            className="inline-flex items-center gap-1.5 bg-slate-700 hover:bg-slate-800 text-white font-semibold px-3 py-2 rounded-xl text-xs shadow-sm transition-colors disabled:opacity-50"
            title="Export all matching students as CSV"
          >
            <Download className="w-3.5 h-3.5" /> CSV
          </button>

          {user?.role === 'admin' && (
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2.5 rounded-xl text-sm shadow-md shadow-indigo-100 transition-colors"
            >
              <Plus className="w-4 h-4" /> Enroll New Student
            </button>
          )}
        </div>
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

      {fetchError && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between gap-3 text-rose-700 text-xs font-semibold">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{fetchError}</span>
          </div>
          <button
            type="button"
            onClick={() => fetchStudents()}
            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      {/* Filter / Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200 text-sm w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, roll no, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent border-none outline-none w-full text-xs text-slate-800 placeholder:text-slate-400"
          />
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d._id} value={d._id}>{d.name} ({d.code})</option>
            ))}
          </select>

          <select
            value={selectedSem}
            onChange={(e) => setSelectedSem(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="">All Semesters</option>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
              <option key={s} value={s}>Semester {s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Students Table */}
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
                  <th className="py-4 px-6">Student Details</th>
                  <th className="py-4 px-6">Enrollment & Roll</th>
                  <th className="py-4 px-6">Department</th>
                  <th className="py-4 px-6">Semester & Section</th>
                  <th className="py-4 px-6">Guardian Info</th>
                  <th className="py-4 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {students.length > 0 ? (
                  students.map((st) => (
                    <tr
                      key={st._id}
                      onClick={() => {
                        setSelectedStudentId(st._id);
                        setShowDossierModal(true);
                      }}
                      className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-sm">
                            {st.user?.name?.charAt(0) || 'S'}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-sm hover:text-indigo-600 transition-colors">{st.user?.name}</p>
                            <p className="text-[11px] text-slate-400 flex items-center gap-1">
                              <Mail className="w-3 h-3" /> {st.user?.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded text-[11px]">
                          {st.enrollmentNo}
                        </span>
                        <div className="text-[11px] text-slate-500 mt-0.5 font-medium">Roll: {st.rollNo}</div>
                      </td>
                      <td className="py-4 px-6 font-semibold text-slate-700">
                        {st.department?.name} ({st.department?.code})
                      </td>
                      <td className="py-4 px-6">
                        <span className="font-semibold text-slate-800">Semester {st.semester}</span>
                        <span className="text-slate-400 ml-1">({st.section})</span>
                        <div className="text-[11px] text-slate-400">{st.batchYear}</div>
                      </td>
                      <td className="py-4 px-6">
                        <p className="font-medium text-slate-700">{st.guardianName || 'N/A'}</p>
                        <p className="text-[11px] text-slate-400">{st.guardianPhone || 'No contact'}</p>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedStudentId(st._id);
                            setShowDossierModal(true);
                          }}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" /> Dossier
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-slate-400 font-medium">
                      No students found matching your criteria.
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
                <span className="font-semibold text-slate-700">{pagination.total}</span> students
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

      {/* Add Student Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-lg text-slate-900 mb-1">Enroll New Student</h3>
            <p className="text-xs text-slate-500 mb-5">Create student credentials and academic dossier</p>

            <form onSubmit={handleCreateStudent} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Aryan Sharma"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Student Email</label>
                  <input
                    type="email"
                    required
                    placeholder="aryan@college.edu"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Initial Password</label>
                  <input
                    type="password"
                    placeholder="Leave blank for College@123"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
                  <select
                    required
                    value={formData.departmentId}
                    onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="">Select Department</option>
                    {departments.map((d) => (
                      <option key={d._id} value={d._id}>{d.name} ({d.code})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Semester</label>
                  <select
                    value={formData.semester}
                    onChange={(e) => setFormData({ ...formData, semester: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                      <option key={s} value={s}>Semester {s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Batch (Academic Years)</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 2024-2028"
                    value={formData.batchYear}
                    onChange={(e) => setFormData({ ...formData, batchYear: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Section</label>
                  <input
                    type="text"
                    required
                    value={formData.section}
                    onChange={(e) => setFormData({ ...formData, section: e.target.value.toUpperCase() })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Guardian Name</label>
                  <input
                    type="text"
                    placeholder="Parent / Guardian Name"
                    value={formData.guardianName}
                    onChange={(e) => setFormData({ ...formData, guardianName: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Guardian Phone</label>
                  <input
                    type="text"
                    placeholder="+91 9876543210"
                    value={formData.guardianPhone}
                    onChange={(e) => setFormData({ ...formData, guardianPhone: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs shadow-md shadow-indigo-100 transition-colors"
                >
                  Complete Enrollment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Student Dossier Modal */}
      <StudentDossierModal
        isOpen={showDossierModal}
        onClose={() => setShowDossierModal(false)}
        studentId={selectedStudentId}
      />
    </div>
  );
};

export default Students;
