import express from 'express';
import { getNotices, createNotice, deleteNotice } from '../controllers/noticeController.js';
import { protect, authorize } from '../middlewares/auth.js';
import { cacheMiddleware } from '../config/cache.js';

const router = express.Router();
router.use(protect);

router.route('/')
  .get(cacheMiddleware(120), getNotices)
  .post(authorize('admin', 'faculty'), createNotice);

router.delete('/:id', authorize('admin'), deleteNotice);

export default router;
