import mongoose from 'mongoose';

const paymentHistorySchema = new mongoose.Schema(
  {
    amount: { type: Number, required: true },
    transactionId: { type: String, required: true },
    method: { type: String, enum: ['Online', 'Cash', 'Cheque', 'UPI', 'Bank Transfer'], default: 'Online' },
    date: { type: Date, default: Date.now },
    receiptNo: { type: String, required: true },
  },
  { timestamps: true }
);

const feeSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
    title: { type: String, required: true }, // e.g. "Semester 3 Tuition & Exam Fee"
    semester: { type: Number, required: true },
    academicYear: { type: String, required: true }, // e.g. "2025-2026"
    totalAmount: { type: Number, required: true },
    paidAmount: { type: Number, default: 0 },
    status: { type: String, enum: ['Pending', 'Partial', 'Paid'], default: 'Pending' },
    dueDate: { type: Date, required: true },
    payments: [paymentHistorySchema],
  },
  { timestamps: true }
);

const Fee = mongoose.model('Fee', feeSchema);
export default Fee;
