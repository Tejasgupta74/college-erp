import { X, Printer, GraduationCap, Download } from 'lucide-react';
import { exportFeeReceiptPDF, INSTITUTION_CONFIG } from '../utils/exportUtils';

export const FeeReceiptModal = ({ isOpen, onClose, fee }) => {
  if (!isOpen || !fee) return null;

  const handlePrint = () => window.print();
  const handleDownloadPDF = () => {
    exportFeeReceiptPDF(fee);
  };

  const payments = Array.isArray(fee.payments) ? fee.payments : [];
  const latestPayment = payments.length > 0 ? payments[payments.length - 1] : null;
  const receiptNo = latestPayment?.receiptNo || fee.receiptNo || (fee._id ? `REC-${fee._id.toString().slice(-6).toUpperCase()}` : 'N/A');
  const transactionId = latestPayment?.transactionId || fee.transactionId || 'N/A';
  const paymentDate = latestPayment?.date
    ? new Date(latestPayment.date).toLocaleDateString()
    : (fee.paymentDate ? new Date(fee.paymentDate).toLocaleDateString() : 'N/A');
  const paymentMethod = latestPayment?.method || fee.paymentMethod || 'N/A';

  const totalAmount = Number(fee.totalAmount || fee.amount || 0);
  const paidAmount = Number(fee.paidAmount || (fee.status === 'Paid' ? totalAmount : 0));
  const remainingDue = Math.max(0, totalAmount - paidAmount);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Action Bar (Hidden during print) */}
        <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between print:hidden">
          <span className="font-bold text-xs uppercase tracking-wider text-slate-600">Official Fee Receipt</span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPDF}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
            >
              <Download className="w-3.5 h-3.5" /> Download PDF
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
            >
              <Printer className="w-3.5 h-3.5" /> Print Receipt
            </button>
            <button onClick={onClose} className="p-1.5 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-200">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Paper Body */}
        <div className="p-8 overflow-y-auto space-y-6 text-slate-800 bg-white" id="printable-receipt">
          {/* Header */}
          <div className="flex items-center justify-between pb-6 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-100">
                <GraduationCap className="w-7 h-7" />
              </div>
              <div>
                <h2 className="font-extrabold text-lg text-slate-900 tracking-tight leading-none">College ERP System</h2>
                <p className="text-[11px] text-slate-500 mt-1 font-medium">{INSTITUTION_CONFIG.location}</p>
                <p className="text-[10px] text-slate-400">{INSTITUTION_CONFIG.campus}</p>
              </div>
            </div>
            <div className="text-right">
              <span className="inline-block px-2.5 py-1 bg-emerald-50 text-emerald-700 font-bold text-[10px] uppercase rounded-full border border-emerald-200">
                Fee Receipt
              </span>
              <p className="font-mono text-xs font-bold text-slate-800 mt-1.5">{receiptNo}</p>
            </div>
          </div>

          {/* Student & Payment Metadata Grid */}
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Billed To (Student)</span>
              <p className="font-bold text-slate-900 text-sm">{fee.student?.name || 'N/A'}</p>
              <p className="text-slate-500 font-medium">Department: {fee.department?.name || fee.student?.department?.name || 'N/A'}</p>
              <p className="text-slate-500 font-medium">
                {fee.semester ? `Semester ${fee.semester}` : ''}
                {fee.academicYear ? ` • Academic Year ${fee.academicYear}` : ''}
              </p>
            </div>

            <div className="space-y-1 text-right">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Latest Payment Summary</span>
              <p className="text-slate-600">Date: <strong className="text-slate-900">{paymentDate}</strong></p>
              <p className="text-slate-600">Method: <strong className="text-slate-900">{paymentMethod.toUpperCase()}</strong></p>
              <p className="text-slate-600 font-mono text-[11px]">Txn ID: {transactionId}</p>
            </div>
          </div>

          {/* Line Item Table */}
          <div className="rounded-2xl border border-slate-200 overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] border-b border-slate-200">
                  <th className="py-2.5 px-4">Description</th>
                  <th className="py-2.5 px-4 text-right">Total Fee (₹)</th>
                  <th className="py-2.5 px-4 text-right">Paid Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-3 px-4 font-semibold text-slate-800">{fee.title || 'Tuition & Academic Fees'}</td>
                  <td className="py-3 px-4 text-right font-medium text-slate-600">₹{totalAmount.toLocaleString()}</td>
                  <td className="py-3 px-4 text-right font-bold text-emerald-600">₹{paidAmount.toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Installment History Table (if multiple / partial payments exist) */}
          {payments.length > 0 && (
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Payment Installment Breakdown ({payments.length} Recorded)
              </span>
              <div className="rounded-2xl border border-slate-200 overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 font-bold uppercase text-[9px] border-b border-slate-200">
                      <th className="py-2 px-3">#</th>
                      <th className="py-2 px-3">Receipt No</th>
                      <th className="py-2 px-3">Txn ID</th>
                      <th className="py-2 px-3">Date</th>
                      <th className="py-2 px-3">Method</th>
                      <th className="py-2 px-3 text-right">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-[11px]">
                    {payments.map((p, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="py-2 px-3 font-semibold text-slate-500">#{idx + 1}</td>
                        <td className="py-2 px-3 font-mono font-medium text-slate-700">{p.receiptNo || 'N/A'}</td>
                        <td className="py-2 px-3 font-mono text-slate-500">{p.transactionId || 'N/A'}</td>
                        <td className="py-2 px-3 text-slate-600">{p.date ? new Date(p.date).toLocaleDateString() : 'N/A'}</td>
                        <td className="py-2 px-3 font-medium text-slate-600">{(p.method || 'N/A').toUpperCase()}</td>
                        <td className="py-2 px-3 text-right font-bold text-emerald-600">₹{Number(p.amount || 0).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Totals & Outstanding */}
          <div className="p-4 bg-slate-50 rounded-2xl flex items-center justify-between text-xs">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Remaining Balance</span>
              <span className={`font-bold text-sm ${remainingDue > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                {remainingDue > 0
                  ? `₹${remainingDue.toLocaleString()} (Due)`
                  : '₹0.00 (Fully Settled)'}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Total Settled</span>
              <span className="font-extrabold text-lg text-indigo-700">₹{paidAmount.toLocaleString()}</span>
            </div>
          </div>

          {/* Stamp & Signatures */}
          <div className="pt-8 flex items-end justify-between border-t border-slate-100 text-[11px] text-slate-400">
            <div>
              <p className="font-medium text-slate-500">{INSTITUTION_CONFIG.footerAuth}</p>
              <p className="text-[10px]">Issued by institutional finance portal.</p>
            </div>
            <div className="text-center">
              <div className="w-28 border-b border-slate-300 pb-1 mb-1 font-serif text-slate-700 italic font-bold">Finance Officer</div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase">Accounts Section</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeeReceiptModal;
