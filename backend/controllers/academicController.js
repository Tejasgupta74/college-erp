import Department from '../models/Department.js';
import Course from '../models/Course.js';
import StudentProfile from '../models/StudentProfile.js';
import Attendance from '../models/Attendance.js';
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
    const department = await Department.create({ name, code, description, hod: hod || null });
    invalidateCache('erp:/api/academics*');
    recordAudit({ user: req.user, action: 'CREATE_DEPARTMENT', resource: 'Department', resourceId: department._id, ip: req.ip, details: { name, code } });
    res.status(201).json({ success: true, data: department });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateDepartment = async (req, res) => {
  try {
    const updateData = { ...req.body };
    if (updateData.hod === '') updateData.hod = null;
    const department = await Department.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });
    if (!department) return res.status(404).json({ success: false, message: 'Department not found' });
    invalidateCache('erp:/api/academics*');
    recordAudit({ user: req.user, action: 'UPDATE_DEPARTMENT', resource: 'Department', resourceId: department._id, ip: req.ip });
    res.json({ success: true, data: department });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteDepartment = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);
    if (!department) return res.status(404).json({ success: false, message: 'Department not found' });

    // Guard: check for orphaned references in courses and students
    const [coursesCount, studentsCount] = await Promise.all([
      Course.countDocuments({ department: req.params.id }),
      StudentProfile.countDocuments({ department: req.params.id }),
    ]);

    if (coursesCount > 0 || studentsCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete department: ${coursesCount} courses and ${studentsCount} students are currently associated with it. Please reassign or remove them first.`,
      });
    }

    await Department.findByIdAndDelete(req.params.id);
    invalidateCache('erp:/api/academics*');
    recordAudit({ user: req.user, action: 'DELETE_DEPARTMENT', resource: 'Department', resourceId: req.params.id, ip: req.ip });
    res.json({ success: true, message: 'Department removed successfully' });
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
    if (req.user.role === 'faculty') {
      filter.faculty = req.user._id;
    } else if (req.user.role === 'student') {
      const profile = await StudentProfile.findOne({ user: req.user._id }).select('department semester');
      if (!profile) return res.json({ success: true, count: 0, data: [] });
      filter.department = profile.department;
      filter.semester = profile.semester;
    } else if (faculty) {
      filter.faculty = faculty;
    }

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
    const course = await Course.create({ name, code, credits, department, semester, type, faculty: faculty || null, description });
    invalidateCache('erp:/api/academics*');
    recordAudit({ user: req.user, action: 'CREATE_COURSE', resource: 'Course', resourceId: course._id, ip: req.ip, details: { name, code, credits } });
    res.status(201).json({ success: true, data: course });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateCourse = async (req, res) => {
  try {
    const updateData = { ...req.body };
    if (updateData.faculty === '') updateData.faculty = null;
    const course = await Course.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true })
      .populate('department', 'name code')
      .populate('faculty', 'name email');

    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
    invalidateCache('erp:/api/academics*');
    recordAudit({ user: req.user, action: 'UPDATE_COURSE', resource: 'Course', resourceId: course._id, ip: req.ip });
    res.json({ success: true, data: course });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });

    // Guard: check for associated attendance records
    const attendanceCount = await Attendance.countDocuments({ course: req.params.id });
    if (attendanceCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete course: ${attendanceCount} attendance sessions are recorded for it. Please archive or reassign attendance first.`,
      });
    }

    await Course.findByIdAndDelete(req.params.id);
    invalidateCache('erp:/api/academics*');
    recordAudit({ user: req.user, action: 'DELETE_COURSE', resource: 'Course', resourceId: req.params.id, ip: req.ip });
    res.json({ success: true, message: 'Course removed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
