import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Plus, Filter, CheckCircle2, AlertCircle, CheckCircle, Receipt } from 'lucide-react';
import FeeReceiptModal from '../components/FeeReceiptModal';

const initialInvoiceData = {
  studentId: '',
  departmentId: '',
  title: '',
  semester: 1,
  academicYear: '2025-2026',
  totalAmount: '',
  dueDate: '',
};

export const Fees = () => {
  const { user } = useAuth();
  const isStudent = user?.role === 'student';
  const isAccountant = user?.role === 'accountant' || user?.role === 'admin';

  const [fees, setFees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  // Modals
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedFee, setSelectedFee] = useState(null);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('UPI');

  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptFee, setReceiptFee] = useState(null);

  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invoiceData, setInvoiceData] = useState(initialInvoiceData);
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });
  const [fetchError, setFetchError] = useState(null);

  const fetchFees = async (signal) => {
    setLoading(true);
    setFetchError(null);
    try {
      let url = `/fees?page=${page}&limit=20&`;
      if (isStudent && user?._id) url += `studentId=${user._id}&`;
      if (statusFilter) url += `status=${statusFilter}&`;

      const [feeRes, deptRes, stRes] = await Promise.all([
        api.get(url, { signal }),
        api.get('/academics/departments', { signal }),
        isAccountant ? api.get('/students?limit=100', { signal }) : Promise.resolve({ data: { data: [] } }),
      ]);

      setFees(feeRes.data.data || []);
      setPagination({
        page: feeRes.data.page || 1,
        pages: feeRes.data.pages || 1,
        total: feeRes.data.total || (feeRes.data.data || []).length,
      });
      setDepartments(deptRes.data.data || []);
      setStudents(stRes.data.data || []);
    } catch (err) {
      if (err.code !== 'ERR_CANCELED') {
        console.error(err);
        setFetchError('Failed to load fee records. Please check connection and retry.');
      }
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  useEffect(() => {
    const controller = new AbortController();
    fetchFees(controller.signal);
    return () => controller.abort();
  }, [page, statusFilter, user]);

  useEffect(() => {
    if (!statusMsg.text) return;
    const timer = setTimeout(() => setStatusMsg({ type: '', text: '' }), 4000);
    return () => clearTimeout(timer);
  }, [statusMsg]);

  const handlePay = async (e) => {
    e.preventDefault();
    if (!selectedFee) return;

    try {
      const res = await api.post(`/fees/${selectedFee._id}/pay`, {
        amount: Number(payAmount),
        method: payMethod,
      });

      setStatusMsg({
        type: 'success',
        text: `Payment of ₹${payAmount} processed successfully! Receipt No: ${res.data.receipt?.receiptNo}`,
      });
      setShowPayModal(false);
      setSelectedFee(null);
      setPayAmount('');
      fetchFees();
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.response?.data?.message || 'Payment processing failed' });
    }
  };

  const handleCreateInvoice = async (e) => {
    e.preventDefault();
    try {
      await api.post('/fees', {
        ...invoiceData,
        totalAmount: Number(invoiceData.totalAmount),
      });

      setStatusMsg({ type: 'success', text: 'Fee invoice issued successfully' });
      setShowInvoiceModal(false);
      setInvoiceData(initialInvoiceData);
      fetchFees();
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.response?.data?.message || 'Failed to issue invoice' });
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Fee Management & Invoices</h1>
          <p className="text-sm text-slate-500 mt-1">
            {isStudent ? 'Track tuition billing, payment history, and instant receipts' : 'Campus billing, collections, and financial reconciliation'}
          </p>
        </div>

        {isAccountant && (
          <button
            onClick={() => setShowInvoiceModal(true)}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2.5 rounded-xl text-sm shadow-md shadow-indigo-100 transition-colors"
          >
            <Plus className="w-4 h-4" /> Issue Fee Invoice
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
            onClick={() => fetchFees()}
            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          <Filter className="w-4 h-4 text-indigo-600" />
          <span>Status:</span>
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        >
          <option value="">All Invoices</option>
          <option value="Pending">Pending</option>
          <option value="Partial">Partial</option>
          <option value="Paid">Paid</option>
        </select>
      </div>

      {/* Invoices List */}
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
                  <th className="py-4 px-6">Invoice Title</th>
                  <th className="py-4 px-6">Student</th>
                  <th className="py-4 px-6">Semester</th>
                  <th className="py-4 px-6">Total Amount</th>
                  <th className="py-4 px-6">Paid Amount</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {fees.length > 0 ? (
                  fees.map((fee) => {
                    const balance = fee.totalAmount - fee.paidAmount;
                    return (
                      <tr key={fee._id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-4 px-6">
                          <p className="font-bold text-slate-900 text-sm">{fee.title}</p>
                          <span className="text-[11px] text-slate-400">
                            Due: {new Date(fee.dueDate).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <p className="font-semibold text-slate-800">{fee.student?.name}</p>
                          <p className="text-[11px] text-slate-400">{fee.student?.email}</p>
                        </td>
                        <td className="py-4 px-6 font-medium text-slate-600">
                          Semester {fee.semester} ({fee.academicYear})
                        </td>
                        <td className="py-4 px-6 font-bold text-slate-900">
                          ₹{fee.totalAmount.toLocaleString()}
                        </td>
                        <td className="py-4 px-6 font-semibold text-emerald-600">
                          ₹{fee.paidAmount.toLocaleString()}
                        </td>
                        <td className="py-4 px-6">
                          <span
                            className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                              fee.status === 'Paid'
                                ? 'bg-emerald-100 text-emerald-800'
                                : fee.status === 'Partial'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {fee.status}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {fee.paidAmount > 0 && (
                              <button
                                onClick={() => {
                                  setReceiptFee(fee);
                                  setShowReceiptModal(true);
                                }}
                                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold inline-flex items-center gap-1 transition-colors"
                                title="View & Print Official Receipt"
                              >
                                <Receipt className="w-3.5 h-3.5 text-indigo-600" />
                                Receipt
                              </button>
                            )}

                            {fee.status !== 'Paid' ? (
                              (user?.role === 'admin' || user?.role === 'accountant') ? (
                                <button
                                  onClick={() => {
                                    setSelectedFee(fee);
                                    setPayAmount(balance.toString());
                                    setShowPayModal(true);
                                  }}
                                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
                                >
                                  Record Payment
                                </button>
                              ) : (
                                <span className="text-xs text-amber-600 font-medium px-2.5 py-1 bg-amber-50 rounded-lg">
                                  Pending Payment
                                </span>
                              )
                            ) : (
                              <div className="inline-flex items-center gap-1 text-emerald-700 font-semibold text-[11px] px-2 py-1 bg-emerald-50 rounded-lg">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Settled
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-slate-400 font-medium">
                      No fee records found.
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
                <span className="font-semibold text-slate-700">{pagination.total}</span> invoices
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

      {/* Pay Modal */}
      {showPayModal && selectedFee && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="font-bold text-lg text-slate-900 mb-1">Approve & Record Fee Payment</h3>
            <p className="text-xs text-slate-500 mb-4">{selectedFee.title}</p>

            <div className="p-4 bg-slate-50 rounded-2xl mb-4 text-xs space-y-1">
              <div className="flex justify-between text-slate-600">
                <span>Total Fee:</span>
                <span className="font-bold text-slate-800">₹{selectedFee.totalAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Already Paid:</span>
                <span className="font-bold text-emerald-600">₹{selectedFee.paidAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-900 font-bold pt-1 border-t border-slate-200">
                <span>Remaining Balance:</span>
                <span className="text-rose-600">₹{(selectedFee.totalAmount - selectedFee.paidAmount).toLocaleString()}</span>
              </div>
            </div>

            <form onSubmit={handlePay} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Amount to Pay (₹)</label>
                <input
                  type="number"
                  required
                  min="1"
                  max={selectedFee.totalAmount - selectedFee.paidAmount}
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Method</label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="UPI">Instant UPI / QR</option>
                  <option value="Online">Debit/Credit Card (Online Gateway)</option>
                  <option value="Bank Transfer">NEFT / NetBanking</option>
                  <option value="Cash">Cash (Counter Deposit)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowPayModal(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs shadow-md shadow-emerald-100 transition-colors"
                >
                  Confirm & Generate Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Issue Invoice Modal (Accountant / Admin) */}
      {showInvoiceModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl">
            <h3 className="font-bold text-lg text-slate-900 mb-1">Issue Fee Invoice</h3>
            <p className="text-xs text-slate-500 mb-4">Create a student fee obligation</p>

            <form onSubmit={handleCreateInvoice} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Student</label>
                <select
                  required
                  value={invoiceData.studentId}
                  onChange={(e) => {
                    const st = students.find((s) => (s.user?._id || s.user)?.toString() === e.target.value?.toString());
                    setInvoiceData({
                      ...invoiceData,
                      studentId: e.target.value,
                      departmentId: st?.department?._id || '',
                      semester: st?.semester || 1,
                    });
                  }}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="">Choose Student</option>
                  {students.map((st) => (
                    <option key={st._id} value={st.user?._id}>
                      {st.user?.name} ({st.rollNo} - {st.department?.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Invoice Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Semester 5 Tuition & Examination Fee"
                  value={invoiceData.title}
                  onChange={(e) => setInvoiceData({ ...invoiceData, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Total Amount (₹)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="e.g. 45000"
                    value={invoiceData.totalAmount}
                    onChange={(e) => setInvoiceData({ ...invoiceData, totalAmount: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    required
                    value={invoiceData.dueDate}
                    onChange={(e) => setInvoiceData({ ...invoiceData, dueDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowInvoiceModal(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs shadow-md shadow-indigo-100 transition-colors"
                >
                  Generate Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Fee Receipt Modal */}
      <FeeReceiptModal
        isOpen={showReceiptModal}
        onClose={() => setShowReceiptModal(false)}
        fee={receiptFee}
      />
    </div>
  );
};

export default Fees;
