import Attendance from '../models/Attendance.js';
import Course from '../models/Course.js';
import StudentProfile from '../models/StudentProfile.js';
import { recordAudit } from '../utils/audit.js';

// Helper for date range normalization without mutation
const getDayRange = (date) => {
  const sessionDate = date ? new Date(date) : new Date();
  const startOfDay = new Date(sessionDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(sessionDate);
  endOfDay.setHours(23, 59, 59, 999);
  return { sessionDate, startOfDay, endOfDay };
};

// @desc    Mark or update attendance for a class session
// @route   POST /api/attendance
// @access  Private (Faculty or Admin)
export const markAttendance = async (req, res) => {
  try {
    const { courseId, departmentId, date, semester = 1, section = 'A', topicCovered = '', records } = req.body;
    if (!courseId || !departmentId || !Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ success: false, message: 'Please provide course, department, and student records' });
    }

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
    if (course.department.toString() !== departmentId || course.semester !== Number(semester)) {
      return res.status(400).json({ success: false, message: 'Course, department, and semester do not match' });
    }
    if (req.user.role === 'faculty' && course.faculty?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'You can only mark attendance for your assigned courses' });
    }
    if (date && Number.isNaN(new Date(date).getTime())) {
      return res.status(400).json({ success: false, message: 'Invalid attendance date' });
    }

    const studentIds = records.map((record) => record?.student?.toString());
    if (studentIds.some((id) => !id) || new Set(studentIds).size !== studentIds.length) {
      return res.status(400).json({ success: false, message: 'Attendance records must contain unique student IDs' });
    }
    const allowedStatuses = new Set(['Present', 'Absent', 'Late', 'Excused']);
    if (records.some((record) => !allowedStatuses.has(record.status || 'Present'))) {
      return res.status(400).json({ success: false, message: 'Attendance contains an invalid status' });
    }
    const rosterCount = await StudentProfile.countDocuments({
      user: { $in: studentIds }, department: course.department, semester: Number(semester), section,
    });
    if (rosterCount !== studentIds.length) {
      return res.status(400).json({ success: false, message: 'Attendance includes students outside this course section' });
    }

    const { sessionDate, startOfDay, endOfDay } = getDayRange(date);
    let attendance = await Attendance.findOne({ course: courseId, section, date: { $gte: startOfDay, $lte: endOfDay } });

    if (attendance) {
      attendance.records = records;
      if (topicCovered) attendance.topicCovered = topicCovered;
      attendance.faculty = req.user._id;
      await attendance.save();
    } else {
      attendance = await Attendance.create({
        course: courseId, department: departmentId, faculty: req.user._id,
        date: sessionDate, semester, section, topicCovered, records,
      });
    }

    recordAudit({
      user: req.user,
      action: 'MARK_ATTENDANCE',
      resource: 'Attendance',
      resourceId: attendance._id,
      ip: req.ip,
      details: { courseId, section, totalStudents: records.length },
    });

    const populated = await Attendance.findById(attendance._id)
      .populate('course', 'name code')
      .populate('records.student', 'name email');

    res.status(201).json({ success: true, message: 'Attendance saved successfully', data: populated });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === 'production' ? 'An unexpected server error occurred' : error.message,
    });
  }
};

// @desc    Get attendance records by course / date
// @route   GET /api/attendance
// @access  Private
export const getAttendance = async (req, res) => {
  try {
    const { courseId, date, semester, section } = req.query;
    const query = {};
    if (courseId) query.course = courseId;
    if (semester) query.semester = Number(semester);
    if (section) query.section = section;
    if (date) {
      if (Number.isNaN(new Date(date).getTime())) return res.status(400).json({ success: false, message: 'Invalid attendance date' });
      const { startOfDay, endOfDay } = getDayRange(date);
      query.date = { $gte: startOfDay, $lte: endOfDay };
    }
    if (req.user.role === 'faculty') {
      const assignedCourseIds = await Course.find({ faculty: req.user._id }).distinct('_id');
      query.course = { ...(courseId ? { $eq: courseId } : {}), $in: assignedCourseIds };
    }

    const records = await Attendance.find(query)
      .populate('course', 'name code')
      .populate('faculty', 'name email')
      .populate('records.student', 'name email')
      .sort({ date: -1 });

    res.json({ success: true, count: records.length, data: records });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === 'production' ? 'An unexpected server error occurred' : error.message,
    });
  }
};

// @desc    Get attendance breakdown for a specific student
// @route   GET /api/attendance/student/:studentId
// @access  Private
export const getStudentAttendanceSummary = async (req, res) => {
  try {
    const paramId = req.params.studentId;
    const studentUserId = (!paramId || paramId === 'me') ? req.user._id.toString() : paramId.toString();
    if (req.user.role === 'student' && studentUserId !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'You can only view your own attendance' });
    }
    if (!['admin', 'faculty', 'student'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Not authorized to view attendance summaries' });
    }
    if (req.user.role === 'faculty') {
      const profile = await StudentProfile.findOne({ user: studentUserId }).select('department semester');
      const allowedCourse = profile && await Course.exists({ faculty: req.user._id, department: profile.department, semester: profile.semester });
      if (!allowedCourse) return res.status(403).json({ success: false, message: 'You can only view students in your assigned courses' });
    }
    const sessionQuery = { 'records.student': studentUserId };
    if (req.user.role === 'faculty') {
      sessionQuery.course = { $in: await Course.find({ faculty: req.user._id }).distinct('_id') };
    }
    const sessions = await Attendance.find(sessionQuery).populate('course', 'name code credits');

    const courseStats = {};
    sessions.forEach((session) => {
      const courseId = session.course?._id?.toString() || 'unknown';
      if (!courseStats[courseId]) {
        courseStats[courseId] = {
          courseId,
          courseName: session.course?.name || 'Unknown Course',
          courseCode: session.course?.code || '',
          total: 0,
          present: 0,
          absent: 0,
          percentage: 0,
        };
      }
      courseStats[courseId].total++;
      const rec = session.records.find((r) => r.student.toString() === studentUserId);
      if (rec && (rec.status === 'Present' || rec.status === 'Late')) {
        courseStats[courseId].present++;
      } else {
        courseStats[courseId].absent++;
      }
    });

    let overallTotal = 0;
    let overallPresent = 0;
    const breakdown = Object.values(courseStats).map((item) => {
      overallTotal += item.total;
      overallPresent += item.present;
      item.percentage = item.total > 0 ? Number(((item.present / item.total) * 100).toFixed(1)) : 100;
      return item;
    });

    const overallPercentage = overallTotal > 0 ? Number(((overallPresent / overallTotal) * 100).toFixed(1)) : 100;
    res.json({
      success: true,
      data: {
        overallTotal,
        overallPresent,
        overallPercentage,
        isShortage: overallPercentage < 75,
        breakdown,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === 'production' ? 'An unexpected server error occurred' : error.message,
    });
  }
};
