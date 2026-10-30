import express from 'express';
import { getExams, createExam, recordMarks, getStudentReportCard } from '../controllers/examController.js';
import { protect, authorize } from '../middlewares/auth.js';

const router = express.Router();
router.use(protect);

router.route('/').get(authorize('admin', 'faculty'), getExams).post(authorize('admin', 'faculty'), createExam);
router.post('/:id/marks', authorize('admin', 'faculty'), recordMarks);
router.get('/report-card/:studentId', getStudentReportCard);

export default router;
