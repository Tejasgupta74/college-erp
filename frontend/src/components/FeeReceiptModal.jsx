import { X, Printer, CheckCircle, GraduationCap } from 'lucide-react';

export const FeeReceiptModal = ({ isOpen, onClose, fee }) => {
  if (!isOpen || !fee) return null;

  const handlePrint = () => {
    window.print();
  };

  const latestPayment = fee.payments && fee.payments.length > 0
    ? fee.payments[fee.payments.length - 1]
    : null;

  const receiptNo = latestPayment?.receiptNo || `REC-${fee._id?.slice(-6).toUpperCase()}`;
  const transactionId = latestPayment?.transactionId || `TXN-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
  const paymentDate = latestPayment?.date ? new Date(latestPayment.date).toLocaleDateString() : new Date().toLocaleDateString();
  const paymentMethod = latestPayment?.method || 'Online';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Action Bar (Hidden during print) */}
        <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between print:hidden">
          <span className="font-bold text-xs uppercase tracking-wider text-slate-600">Official Fee Receipt</span>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
            >
              <Printer className="w-3.5 h-3.5" /> Print Receipt
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-200"
            >
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
                <h2 className="font-extrabold text-lg text-slate-900 tracking-tight leading-none">Apex Institute of Technology</h2>
                <p className="text-[11px] text-slate-500 mt-1 font-medium">Affiliated to State Technical University • Accredited 'A+' Grade</p>
                <p className="text-[10px] text-slate-400">Campus: Knowledge City, Tech Zone 4 • finance@college.edu</p>
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
              <p className="font-bold text-slate-900 text-sm">{fee.student?.name || 'Student Name'}</p>
              <p className="text-slate-500 font-medium">Department: {fee.department?.name || 'Academic Dept'}</p>
              <p className="text-slate-500 font-medium">Semester {fee.semester} • Academic Year {fee.academicYear}</p>
            </div>

            <div className="space-y-1 text-right">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Payment Summary</span>
              <p className="text-slate-600">Date: <strong className="text-slate-900">{paymentDate}</strong></p>
              <p className="text-slate-600">Method: <strong className="text-slate-900">{paymentMethod}</strong></p>
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
                  <td className="py-3 px-4 font-semibold text-slate-800">
                    {fee.title}
                  </td>
                  <td className="py-3 px-4 text-right font-medium text-slate-600">
                    ₹{fee.totalAmount?.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-emerald-600">
                    ₹{fee.paidAmount?.toLocaleString()}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Totals & Outstanding */}
          <div className="p-4 bg-slate-50 rounded-2xl flex items-center justify-between text-xs">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Remaining Balance</span>
              <span className={`font-bold text-sm ${fee.totalAmount - fee.paidAmount > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                {fee.totalAmount - fee.paidAmount > 0
                  ? `₹${(fee.totalAmount - fee.paidAmount).toLocaleString()} (Due)`
                  : '₹0.00 (Fully Settled)'}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Total Settled Now</span>
              <span className="font-extrabold text-lg text-indigo-700">
                ₹{fee.paidAmount?.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Stamp & Signatures */}
          <div className="pt-8 flex items-end justify-between border-t border-slate-100 text-[11px] text-slate-400">
            <div>
              <p className="font-medium text-slate-500">System generated electronic receipt.</p>
              <p className="text-[10px]">No physical signature required for institutional verification.</p>
            </div>
            <div className="text-center">
              <div className="w-28 border-b border-slate-300 pb-1 mb-1 font-serif text-slate-700 italic font-bold">
                Finance Officer
              </div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase">Accounts Section</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeeReceiptModal;
