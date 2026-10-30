import crypto from 'crypto';
import mongoose from 'mongoose';
import Fee from '../models/Fee.js';
import logger from '../config/logger.js';
import { recordAudit } from '../utils/audit.js';

// @desc    Get all fees / invoices
// @route   GET /api/fees
// @access  Private (Admin, Accountant, Student)
export const getFees = async (req, res) => {
  try {
    if (req.user.role === 'faculty') {
      return res.status(403).json({ success: false, message: 'Faculty are not authorized to access fee records' });
    }

    const { studentId, status, departmentId, page = 1, limit = 20 } = req.query;
    const query = {};

    // Strict role scoping: Students can ONLY view their own fee invoices
    if (req.user.role === 'student') {
      query.student = req.user._id;
    } else if (studentId) {
      query.student = studentId;
    }

    if (status) query.status = status;
    if (departmentId) query.department = departmentId;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(Math.max(1, parseInt(limit, 10) || 20), 100);
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
    res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === 'production' ? 'An unexpected server error occurred' : error.message,
    });
  }
};

// @desc    Create new fee invoice
// @route   POST /api/fees
// @access  Private (Admin, Accountant)
export const createFeeInvoice = async (req, res) => {
  try {
    const { studentId, departmentId, title, semester, academicYear, totalAmount, dueDate } = req.body;
    const invoice = await Fee.create({
      student: studentId,
      department: departmentId,
      title,
      semester,
      academicYear,
      totalAmount,
      dueDate,
      status: 'Pending',
      paidAmount: 0,
      payments: [],
    });

    recordAudit({
      user: req.user,
      action: 'CREATE_FEE_INVOICE',
      resource: 'Fee',
      resourceId: invoice._id,
      ip: req.ip,
      details: { studentId, totalAmount, title },
    });

    const populated = await Fee.findById(invoice._id)
      .populate('student', 'name email')
      .populate('department', 'name code');

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Record and approve fee payment
// @route   POST /api/fees/:id/pay
// @access  Private (Admin & Accountant)
export const recordPayment = async (req, res) => {
  try {
    if (!['admin', 'accountant'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Only Administrators and Accounts Officers are authorized to record fee payments',
      });
    }

    const { amount, method } = req.body;
    const allowedMethods = ['Online', 'Cash', 'Cheque', 'UPI', 'Bank Transfer'];
    const paymentMethod = allowedMethods.includes(method) ? method : 'Cash';
    const payAmount = Number(amount);
    if (isNaN(payAmount) || payAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid payment amount' });
    }

    const fee = await Fee.findById(req.params.id);
    if (!fee) return res.status(404).json({ success: false, message: 'Fee invoice not found' });

    // Check balance before processing
    const remainingDue = Math.max(0, fee.totalAmount - fee.paidAmount);
    if (remainingDue <= 0) {
      return res.status(400).json({ success: false, message: 'This invoice is already fully settled' });
    }
    if (payAmount > remainingDue) {
      return res.status(400).json({
        success: false,
        message: `Payment amount (₹${payAmount}) exceeds the remaining balance of ₹${remainingDue}`,
      });
    }

    // Cryptographically secure collision-resistant receipt & transaction IDs
    const receiptNo = `REC-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    const transactionId = `TXN-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    const paymentDate = new Date();

    const newPaymentRecord = {
      _id: new mongoose.Types.ObjectId(),
      amount: payAmount,
      transactionId,
      method: paymentMethod,
      date: paymentDate,
      receiptNo,
    };

    // Single atomic update folding paidAmount, payments array, and status into an aggregation pipeline
    // Guarantees zero race conditions, no separate save() step, and 100% transactional consistency
    const updatedFee = await Fee.findOneAndUpdate(
      {
        _id: req.params.id,
        $expr: { $lte: [{ $add: ['$paidAmount', payAmount] }, '$totalAmount'] },
      },
      [
        {
          $set: {
            paidAmount: { $add: ['$paidAmount', payAmount] },
            payments: {
              $concatArrays: [
                { $ifNull: ['$payments', []] },
                [newPaymentRecord],
              ],
            },
            status: {
              $cond: {
                if: { $gte: [{ $add: ['$paidAmount', payAmount] }, '$totalAmount'] },
                then: 'Paid',
                else: 'Partial',
              },
            },
          },
        },
      ],
      { new: true }
    );

    if (!updatedFee) {
      return res.status(400).json({
        success: false,
        message: 'Payment rejected: amount exceeds invoice balance or invoice is already settled.',
      });
    }

    recordAudit({
      user: req.user,
      action: 'RECORD_FEE_PAYMENT',
      resource: 'Fee',
      resourceId: updatedFee._id,
      ip: req.ip,
      details: { amount: payAmount, receiptNo, transactionId, method: paymentMethod },
    });

    const populated = await Fee.findById(updatedFee._id)
      .populate('student', 'name email phone')
      .populate('department', 'name code');

    res.json({
      success: true,
      message: 'Payment recorded successfully',
      receipt: { receiptNo, transactionId, amount: payAmount, date: paymentDate },
      data: populated,
    });
  } catch (error) {
    logger.error('Failed to record payment', { error: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === 'production' ? 'An unexpected server error occurred' : error.message,
    });
  }
};
