import mongoose from 'mongoose';
import Attendance from '../models/Attendance.js';
import Course from '../models/Course.js';
import StudentProfile from '../models/StudentProfile.js';
import { recordAudit } from '../utils/audit.js';

// Helper for strict YYYY-MM-DD date normalization independent of server timezone
const parseDateString = (input) => {
  if (!input) {
    return new Date().toISOString().slice(0, 10);
  }
  if (typeof input === 'string') {
    const match = input.match(/^(\d{4}-\d{2}-\d{2})/);
    if (match) return match[1];
  }
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
};

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
    const {
      courseId,
      departmentId,
      date,
      semester = 1,
      section = 'A',
      sessionSlot = 1,
      sessionType = 'Lecture',
      topicCovered = '',
      records,
      attendanceId,
      _id,
    } = req.body;

    if (!courseId || !departmentId || !Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ success: false, message: 'Please provide course, department, and student records' });
    }

    if (!mongoose.Types.ObjectId.isValid(courseId) || !mongoose.Types.ObjectId.isValid(departmentId)) {
      return res.status(400).json({ success: false, message: 'Invalid course or department identifier' });
    }

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
    if (course.department.toString() !== departmentId || course.semester !== Number(semester)) {
      return res.status(400).json({ success: false, message: 'Course, department, and semester do not match' });
    }
    if (req.user.role === 'faculty' && course.faculty?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'You can only mark attendance for your assigned courses' });
    }

    const dateStr = parseDateString(date);
    if (!dateStr) {
      return res.status(400).json({ success: false, message: 'Invalid attendance date' });
    }

    // Reject future attendance dates
    const todayStr = new Date().toISOString().slice(0, 10);
    if (dateStr > todayStr) {
      return res.status(400).json({ success: false, message: 'Attendance cannot be marked for future dates' });
    }

    const studentIds = records.map((record) => record?.student?.toString());
    if (studentIds.some((id) => !id || !mongoose.Types.ObjectId.isValid(id)) || new Set(studentIds).size !== studentIds.length) {
      return res.status(400).json({ success: false, message: 'Attendance records must contain valid, unique student IDs' });
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

    const slotNum = Math.max(1, parseInt(sessionSlot, 10) || 1);
    const { sessionDate, startOfDay, endOfDay } = getDayRange(date);
    const trimmedTopic = typeof topicCovered === 'string' ? topicCovered.trim() : '';

    let attendance = null;
    const targetId = attendanceId || _id;

    if (targetId && mongoose.Types.ObjectId.isValid(targetId)) {
      attendance = await Attendance.findById(targetId);
    } else if (trimmedTopic) {
      // If a topic is supplied, match an existing session with the exact same topic on that day
      attendance = await Attendance.findOne({
        course: courseId,
        section,
        topicCovered: trimmedTopic,
        $or: [
          { dateString: dateStr },
          { date: { $gte: startOfDay, $lte: endOfDay } },
        ],
      });
    }

    if (attendance) {
      // Update existing matched session
      attendance.records = records;
      if (trimmedTopic) attendance.topicCovered = trimmedTopic;
      if (sessionType) attendance.sessionType = sessionType;
      attendance.sessionSlot = slotNum;
      attendance.dateString = dateStr;
      attendance.faculty = req.user._id;
      await attendance.save();
    } else {
      // Create new session: calculate slot so it never collides with existing sessions on that day
      const existingSessions = await Attendance.find({
        course: courseId,
        section,
        $or: [
          { dateString: dateStr },
          { date: { $gte: startOfDay, $lte: endOfDay } },
        ],
      }).sort({ sessionSlot: -1 });

      let calculatedSlot = slotNum;
      if (existingSessions.length > 0) {
        const highestSlot = Math.max(...existingSessions.map((s) => s.sessionSlot || 1));
        if (existingSessions.some((s) => s.sessionSlot === calculatedSlot)) {
          calculatedSlot = highestSlot + 1;
        }
      }

      attendance = await Attendance.create({
        course: courseId,
        department: departmentId,
        faculty: req.user._id,
        date: sessionDate,
        dateString: dateStr,
        semester,
        section,
        sessionSlot: calculatedSlot,
        sessionType,
        topicCovered: trimmedTopic,
        records,
      });
    }

    recordAudit({
      user: req.user,
      action: 'MARK_ATTENDANCE',
      resource: 'Attendance',
      resourceId: attendance._id,
      ip: req.ip,
      details: { courseId, section, sessionSlot: attendance.sessionSlot, sessionType, totalStudents: records.length },
    });

    const populated = await Attendance.findById(attendance._id)
      .populate('course', 'name code')
      .populate('records.student', 'name email');

    res.status(201).json({ success: true, message: 'Attendance saved successfully', data: populated });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid identifier format in attendance request' });
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: error.message });
    }
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
    const { courseId, date, semester, section, sessionSlot } = req.query;
    const query = {};
    if (courseId) {
      if (!mongoose.Types.ObjectId.isValid(courseId)) {
        return res.status(400).json({ success: false, message: 'Invalid courseId parameter' });
      }
      query.course = courseId;
    }
    if (semester) {
      const semNum = Number(semester);
      if (!Number.isInteger(semNum) || semNum < 1 || semNum > 12) {
        return res.status(400).json({ success: false, message: 'Invalid semester parameter' });
      }
      query.semester = semNum;
    }
    if (section) query.section = section;
    if (sessionSlot) {
      const slot = Number(sessionSlot);
      if (isNaN(slot)) return res.status(400).json({ success: false, message: 'Invalid sessionSlot parameter' });
      query.sessionSlot = slot;
    }
    if (date) {
      const dateStr = parseDateString(date);
      if (!dateStr) return res.status(400).json({ success: false, message: 'Invalid attendance date' });
      const { startOfDay, endOfDay } = getDayRange(date);
      query.$or = [
        { dateString: dateStr },
        { date: { $gte: startOfDay, $lte: endOfDay } },
      ];
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
    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid identifier parameter' });
    }
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
    if (!mongoose.Types.ObjectId.isValid(studentUserId)) {
      return res.status(400).json({ success: false, message: 'Invalid student ID parameter' });
    }
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
    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid identifier parameter' });
    }
    res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === 'production' ? 'An unexpected server error occurred' : error.message,
    });
  }
};
