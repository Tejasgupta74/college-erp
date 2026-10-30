import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Plus, Pin, Clock, User, CheckCircle, AlertCircle, Trash2 } from 'lucide-react';

const initialNoticeForm = {
  title: '',
  content: '',
  targetAudience: 'all',
  priority: 'Normal',
  isPinned: false,
};

export const Notices = () => {
  const { user } = useAuth();
  const canPost = user?.role === 'admin' || user?.role === 'faculty';

  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState(initialNoticeForm);
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });
  const [fetchError, setFetchError] = useState(null);

  const fetchNotices = async (signal) => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await api.get(`/notices?page=${page}&limit=20`, { signal });
      setNotices(res.data.data || []);
      setPagination({
        page: res.data.page || 1,
        pages: res.data.pages || 1,
        total: res.data.total || (res.data.data || []).length,
      });
    } catch (err) {
      if (err.code !== 'ERR_CANCELED') {
        console.error(err);
        setFetchError('Failed to load campus announcements. Please retry.');
      }
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchNotices(controller.signal);
    return () => controller.abort();
  }, [page]);

  useEffect(() => {
    if (!statusMsg.text) return;
    const timer = setTimeout(() => setStatusMsg({ type: '', text: '' }), 4000);
    return () => clearTimeout(timer);
  }, [statusMsg]);

  const handleCreateNotice = async (e) => {
    e.preventDefault();
    try {
      await api.post('/notices', formData);
      setStatusMsg({ type: 'success', text: 'Announcement published successfully' });
      setShowModal(false);
      setFormData(initialNoticeForm);
      fetchNotices();
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.response?.data?.message || 'Failed to post notice' });
    }
  };

  const handleDeleteNotice = async (id) => {
    if (!window.confirm('Are you sure you want to remove this notice?')) return;
    try {
      await api.delete(`/notices/${id}`);
      setStatusMsg({ type: 'success', text: 'Notice removed' });
      fetchNotices();
    } catch (err) {
      setStatusMsg({ type: 'error', text: 'Failed to delete notice' });
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Campus Notice Board</h1>
          <p className="text-sm text-slate-500 mt-1">Institutional broadcasts, academic circulars, and departmental updates</p>
        </div>

        {canPost && (
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2.5 rounded-xl text-sm shadow-md shadow-indigo-100 transition-colors"
          >
            <Plus className="w-4 h-4" /> Publish Announcement
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

      {fetchError && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between gap-3 text-rose-700 text-xs font-semibold">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{fetchError}</span>
          </div>
          <button
            type="button"
            onClick={() => fetchNotices()}
            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      {/* Notices List */}
      {loading ? (
        <div className="flex justify-center p-12">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {notices.length > 0 ? (
            notices.map((n) => (
              <div
                key={n._id}
                className={`bg-white rounded-3xl p-6 border transition-all ${
                  n.isPinned
                    ? 'border-indigo-200 shadow-md shadow-indigo-50/50 ring-1 ring-indigo-100'
                    : 'border-slate-200/80 shadow-sm'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2.5 mb-2">
                      {n.isPinned && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full uppercase tracking-wider">
                          <Pin className="w-3 h-3" /> Pinned
                        </span>
                      )}
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                          n.priority === 'Urgent'
                            ? 'bg-rose-100 text-rose-700'
                            : n.priority === 'Important'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {n.priority}
                      </span>
                      <span className="text-[11px] font-medium text-slate-400 capitalize">
                        Target: {n.targetAudience}
                      </span>
                    </div>

                    <h3 className="font-bold text-base text-slate-900">{n.title}</h3>
                    <p className="text-xs text-slate-600 mt-2 leading-relaxed whitespace-pre-line">
                      {n.content}
                    </p>
                  </div>

                  {user?.role === 'admin' && (
                    <button
                      onClick={() => handleDeleteNotice(n._id)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-medium">
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>Posted by {n.author?.name || 'Academic Office'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{new Date(n.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center text-slate-400 font-medium bg-white rounded-3xl border border-slate-200">
              No campus announcements posted yet.
            </div>
          )}
        </div>
      )}

      {pagination.pages > 1 && (
        <div className="flex items-center justify-between px-6 py-4 rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <p className="text-xs text-slate-500">
            Showing <span className="font-semibold text-slate-700">{((pagination.page - 1) * 20) + 1}</span> to{' '}
            <span className="font-semibold text-slate-700">{Math.min(pagination.page * 20, pagination.total)}</span> of{' '}
            <span className="font-semibold text-slate-700">{pagination.total}</span> notices
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

      {/* Publish Notice Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl">
            <h3 className="font-bold text-lg text-slate-900 mb-1">Publish Notice</h3>
            <p className="text-xs text-slate-500 mb-4">Broadcast an announcement to students or faculty</p>

            <form onSubmit={handleCreateNotice} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Headline / Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Schedule for Annual Technical Symposium"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Notice Details</label>
                <textarea
                  rows="4"
                  required
                  placeholder="Enter full announcement details here..."
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Target Audience</label>
                  <select
                    value={formData.targetAudience}
                    onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="all">Everyone (All Campus)</option>
                    <option value="students">Students Only</option>
                    <option value="faculty">Faculty & Staff Only</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="Normal">Normal</option>
                    <option value="Important">Important</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="pinCheck"
                  checked={formData.isPinned}
                  onChange={(e) => setFormData({ ...formData, isPinned: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                />
                <label htmlFor="pinCheck" className="text-xs font-semibold text-slate-700 cursor-pointer">
                  Pin this announcement to top of the board
                </label>
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
                  Publish Announcement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notices;
