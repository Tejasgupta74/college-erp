import express from 'express';
import { getFaculty, getFacultyById, updateFaculty, deleteFaculty } from '../controllers/facultyController.js';
import { protect, authorize } from '../middlewares/auth.js';

const router = express.Router();
router.use(protect);

router.get('/', getFaculty);
router.route('/:id').get(getFacultyById).put(authorize('admin'), updateFaculty).delete(authorize('admin'), deleteFaculty);

export default router;
