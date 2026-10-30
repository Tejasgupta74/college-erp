import express from 'express';
import { getFees, createFeeInvoice, recordPayment } from '../controllers/feeController.js';
import { protect, authorize } from '../middlewares/auth.js';

const router = express.Router();
router.use(protect);

router
  .route('/')
  .get(authorize('admin', 'accountant', 'student'), getFees)
  .post(authorize('admin', 'accountant'), createFeeInvoice);

router.post('/:id/pay', authorize('admin'), recordPayment);

export default router;
