import Fee from '../models/Fee.js';

// @desc    Get all fees / invoices
// @route   GET /api/fees
// @access  Private
export const getFees = async (req, res) => {
  try {
    const { studentId, status, departmentId, page = 1, limit = 20 } = req.query;
    const query = {};
    if (studentId) query.student = studentId;
    if (status) query.status = status;
    if (departmentId) query.department = departmentId;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, parseInt(limit, 10));
    const skip = (pageNum - 1) * limitNum;

    const [fees, totalCount] = await Promise.all([
      Fee.find(query)
        .populate('student', 'name email phone')
        .populate('department', 'name code')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Fee.countDocuments(query),
    ]);

    res.json({
      success: true,
      count: fees.length,
      total: totalCount,
      page: pageNum,
      pages: Math.ceil(totalCount / limitNum),
      data: fees,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create new fee invoice
// @route   POST /api/fees
// @access  Private (Admin, Accountant)
export const createFeeInvoice = async (req, res) => {
  try {
    const { studentId, departmentId, title, semester, academicYear, totalAmount, dueDate } = req.body;
    const invoice = await Fee.create({
      student: studentId, department: departmentId, title, semester, academicYear, totalAmount, dueDate,
      status: 'Pending', paidAmount: 0, payments: [],
    });

    const populated = await Fee.findById(invoice._id)
      .populate('student', 'name email')
      .populate('department', 'name code');

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Record fee payment
// @route   POST /api/fees/:id/pay
// @access  Private
export const recordPayment = async (req, res) => {
  try {
    const { amount, method = 'Online' } = req.body;
    const fee = await Fee.findById(req.params.id);
    if (!fee) return res.status(404).json({ success: false, message: 'Fee invoice not found' });

    const payAmount = Number(amount);
    if (isNaN(payAmount) || payAmount <= 0) return res.status(400).json({ success: false, message: 'Invalid payment amount' });

    const receiptNo = `REC-${Date.now().toString().slice(-6)}`;
    const transactionId = `TXN-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
    const paymentDate = new Date();

    fee.payments.push({ amount: payAmount, transactionId, method, date: paymentDate, receiptNo });
    fee.paidAmount += payAmount;
    fee.status = fee.paidAmount >= fee.totalAmount ? 'Paid' : fee.paidAmount > 0 ? 'Partial' : 'Pending';
    await fee.save();

    const updated = await Fee.findById(fee._id)
      .populate('student', 'name email phone')
      .populate('department', 'name code');

    res.json({
      success: true,
      message: 'Payment recorded successfully',
      receipt: { receiptNo, transactionId, amount: payAmount, date: paymentDate },
      data: updated,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
