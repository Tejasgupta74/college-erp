import Department from '../models/Department.js';
import Course from '../models/Course.js';
import { invalidateCache } from '../config/cache.js';
import { recordAudit } from '../utils/audit.js';

// ==================== DEPARTMENTS ====================

export const getDepartments = async (req, res) => {
  try {
    const departments = await Department.find().populate('hod', 'name email phone');
    res.json({ success: true, count: departments.length, data: departments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createDepartment = async (req, res) => {
  try {
    const { name, code, description, hod = null } = req.body;
    const department = await Department.create({ name, code, description, hod });

    invalidateCache('erp:/api/academics*');
    recordAudit({
      user: req.user,
      action: 'CREATE_DEPARTMENT',
      resource: 'Department',
      resourceId: department._id,
      ip: req.ip,
      details: { name, code },
    });

    res.status(201).json({ success: true, data: department });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateDepartment = async (req, res) => {
  try {
    const department = await Department.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!department) return res.status(404).json({ success: false, message: 'Department not found' });

    invalidateCache('erp:/api/academics*');
    recordAudit({
      user: req.user,
      action: 'UPDATE_DEPARTMENT',
      resource: 'Department',
      resourceId: department._id,
      ip: req.ip,
    });

    res.json({ success: true, data: department });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteDepartment = async (req, res) => {
  try {
    const department = await Department.findByIdAndDelete(req.params.id);
    if (!department) return res.status(404).json({ success: false, message: 'Department not found' });

    invalidateCache('erp:/api/academics*');
    recordAudit({
      user: req.user,
      action: 'DELETE_DEPARTMENT',
      resource: 'Department',
      resourceId: req.params.id,
      ip: req.ip,
    });

    res.json({ success: true, message: 'Department removed' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== COURSES ====================

export const getCourses = async (req, res) => {
  try {
    const { department, semester, faculty } = req.query;
    const filter = {};
    if (department) filter.department = department;
    if (semester) filter.semester = Number(semester);
    if (faculty) filter.faculty = faculty;

    const courses = await Course.find(filter)
      .populate('department', 'name code')
      .populate('faculty', 'name email');

    res.json({ success: true, count: courses.length, data: courses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createCourse = async (req, res) => {
  try {
    const { name, code, credits, department, semester, type = 'Theory', faculty = null, description = '' } = req.body;
    const course = await Course.create({ name, code, credits, department, semester, type, faculty, description });

    invalidateCache('erp:/api/academics*');
    recordAudit({
      user: req.user,
      action: 'CREATE_COURSE',
      resource: 'Course',
      resourceId: course._id,
      ip: req.ip,
      details: { name, code, credits },
    });

    res.status(201).json({ success: true, data: course });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateCourse = async (req, res) => {
  try {
    const course = await Course.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
      .populate('department', 'name code')
      .populate('faculty', 'name email');

    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });

    invalidateCache('erp:/api/academics*');
    recordAudit({
      user: req.user,
      action: 'UPDATE_COURSE',
      resource: 'Course',
      resourceId: course._id,
      ip: req.ip,
    });

    res.json({ success: true, data: course });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteCourse = async (req, res) => {
  try {
    const course = await Course.findByIdAndDelete(req.params.id);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });

    invalidateCache('erp:/api/academics*');
    recordAudit({
      user: req.user,
      action: 'DELETE_COURSE',
      resource: 'Course',
      resourceId: req.params.id,
      ip: req.ip,
    });

    res.json({ success: true, message: 'Course removed' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
