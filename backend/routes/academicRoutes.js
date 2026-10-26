import express from 'express';
import {
  getDepartments, createDepartment, updateDepartment, deleteDepartment,
  getCourses, createCourse, updateCourse, deleteCourse,
} from '../controllers/academicController.js';
import { protect, authorize } from '../middlewares/auth.js';
import { cacheMiddleware } from '../config/cache.js';

const router = express.Router();
router.use(protect);

// Departments - Cached for 300s (5 mins)
router.route('/departments')
  .get(cacheMiddleware(300), getDepartments)
  .post(authorize('admin'), createDepartment);

router.route('/departments/:id')
  .put(authorize('admin'), updateDepartment)
  .delete(authorize('admin'), deleteDepartment);

// Courses - Cached for 180s (3 mins)
router.route('/courses')
  .get(cacheMiddleware(180), getCourses)
  .post(authorize('admin'), createCourse);

router.route('/courses/:id')
  .put(authorize('admin'), updateCourse)
  .delete(authorize('admin'), deleteCourse);

export default router;
