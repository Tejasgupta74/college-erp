import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Plus, Search, Mail, Phone, CheckCircle, AlertCircle } from 'lucide-react';

const initialFacultyForm = {
  name: '',
  email: '',
  password: '',
  phone: '',
  departmentId: '',
  employeeId: '',
  designation: 'Assistant Professor',
  qualification: '',
  specialization: '',
};

export const Faculty = () => {
  const { user } = useAuth();
  const [facultyList, setFacultyList] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState(initialFacultyForm);
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });

  const fetchFaculty = async (signal) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (selectedDept) params.set('department', selectedDept);

      const [res, deptRes] = await Promise.all([
        api.get(`/faculty?${params.toString()}`, { signal }),
        api.get('/academics/departments', { signal }),
      ]);

      setFacultyList(res.data.data || []);
      setDepartments(deptRes.data.data || []);
    } catch (err) {
      if (err.code !== 'ERR_CANCELED') console.error(err);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchFaculty(controller.signal);
    return () => controller.abort();
  }, [search, selectedDept]);

  useEffect(() => {
    if (!statusMsg.text) return;
    const timer = setTimeout(() => setStatusMsg({ type: '', text: '' }), 4000);
    return () => clearTimeout(timer);
  }, [statusMsg]);

  const handleCreateFaculty = async (e) => {
    e.preventDefault();
    try {
      await api.post('/auth/create-user', { ...formData, role: 'faculty' });
      setStatusMsg({ type: 'success', text: 'Faculty member created successfully' });
      setShowModal(false);
      setFormData(initialFacultyForm);
      fetchFaculty();
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.response?.data?.message || 'Failed to create faculty member' });
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Faculty Directory</h1>
          <p className="text-sm text-slate-500 mt-1">Institutional professors, lecturers, and departmental leadership</p>
        </div>

        {user?.role === 'admin' && (
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2.5 rounded-xl text-sm shadow-md shadow-indigo-100 transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Faculty Member
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

      {/* Filter / Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200 text-sm w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, employee id..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent border-none outline-none w-full text-xs text-slate-800 placeholder:text-slate-400"
          />
        </div>

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
      </div>

      {/* Faculty Cards Grid */}
      {loading ? (
        <div className="flex justify-center p-12">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {facultyList.map((f) => (
            <div
              key={f._id}
              className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 font-bold flex items-center justify-center text-lg shadow-sm">
                    {f.user?.name?.charAt(0) || 'F'}
                  </div>
                  <span className="font-mono text-[11px] font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
                    {f.employeeId}
                  </span>
                </div>

                <h3 className="font-bold text-base text-slate-900">{f.user?.name}</h3>
                <p className="text-xs font-semibold text-indigo-600 mt-0.5">{f.designation}</p>
                <p className="text-xs text-slate-500 font-medium mt-1">{f.department?.name}</p>

                <div className="mt-4 space-y-1.5 text-xs text-slate-600">
                  <p className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate">{f.user?.email}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{f.user?.phone || 'No phone'}</span>
                  </p>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 text-[11px] text-slate-500">
                <span className="font-semibold text-slate-700">Specialization:</span>{' '}
                {f.specialization || f.qualification || 'Computer Systems'}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Faculty Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-lg text-slate-900 mb-1">Add Faculty Member</h3>
            <p className="text-xs text-slate-500 mb-5">Create faculty account and department assignment</p>

            <form onSubmit={handleCreateFaculty} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name & Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Sunil Nair"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    placeholder="prof.nair@college.edu"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Designation</label>
                  <select
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="Assistant Professor">Assistant Professor</option>
                    <option value="Associate Professor">Associate Professor</option>
                    <option value="Professor">Professor</option>
                    <option value="Professor & HOD">Professor & HOD</option>
                    <option value="Visiting Lecturer">Visiting Lecturer</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Employee ID</label>
                  <input
                    type="text"
                    placeholder="e.g. EMP-CSE-005"
                    value={formData.employeeId}
                    onChange={(e) => setFormData({ ...formData, employeeId: e.target.value.toUpperCase() })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 uppercase"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone</label>
                  <input
                    type="text"
                    placeholder="+91 9876543210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Specialization / Research Area</label>
                <input
                  type="text"
                  placeholder="e.g. Computer Networks & Cybersecurity"
                  value={formData.specialization}
                  onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
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
                  Save Faculty Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Faculty;
