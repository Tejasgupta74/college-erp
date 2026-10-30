import express from 'express';
import {
  getStudents,
  getStudentRoster,
  getStudentById,
  updateStudentProfile,
  deleteStudent,
} from '../controllers/studentController.js';
import { protect, authorize } from '../middlewares/auth.js';

const router = express.Router();
router.use(protect);

router.get('/', authorize('admin', 'faculty', 'accountant'), getStudents);
router.get('/roster', authorize('admin', 'faculty', 'accountant'), getStudentRoster);
router.route('/:id').get(getStudentById).put(authorize('admin'), updateStudentProfile).delete(authorize('admin'), deleteStudent);

export default router;
