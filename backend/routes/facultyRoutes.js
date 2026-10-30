import express from 'express';
import { getFaculty, getFacultyById, updateFaculty, deleteFaculty } from '../controllers/facultyController.js';
import { protect, authorize } from '../middlewares/auth.js';

const router = express.Router();
router.use(protect);

router.get('/', authorize('admin'), getFaculty);
router.route('/:id').get(authorize('admin'), getFacultyById).put(authorize('admin'), updateFaculty).delete(authorize('admin'), deleteFaculty);

export default router;
