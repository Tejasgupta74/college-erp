import express from 'express';
import {
  markAttendance,
  getAttendance,
  getStudentAttendanceSummary,
} from '../controllers/attendanceController.js';
import { protect, authorize } from '../middlewares/auth.js';

const router = express.Router();
router.use(protect);

router.route('/').get(authorize('admin', 'faculty'), getAttendance).post(authorize('admin', 'faculty'), markAttendance);
router.get('/student/:studentId', getStudentAttendanceSummary);

export default router;
