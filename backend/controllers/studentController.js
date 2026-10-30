import mongoose from 'mongoose';
import StudentProfile from '../models/StudentProfile.js';
import User from '../models/User.js';
import Attendance from '../models/Attendance.js';
import Fee from '../models/Fee.js';
import Exam from '../models/Exam.js';
import Course from '../models/Course.js';
import { recordAudit } from '../utils/audit.js';

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const getStudents = async (req, res) => {
  try {
    const { department, semester, section, search, page = 1, limit = 20 } = req.query;
    const query = {};
    if (department) query.department = department;
    if (semester) query.semester = Number(semester);
    if (section) query.section = section;

    if (req.user.role === 'faculty') {
      const assignedCourses = await Course.find({ faculty: req.user._id }).select('department semester');
      const assignments = assignedCourses.map((course) => ({ department: course.department, semester: course.semester }));
      query.$or = assignments.length ? assignments : [{ _id: null }];
    }

    if (search && search.trim()) {
      const s = escapeRegex(search.trim());
      const matchingUsers = await User.find({
        $or: [
          { name: { $regex: s, $options: 'i' } },
          { email: { $regex: s, $options: 'i' } },
        ],
      }).select('_id');
      const userIds = matchingUsers.map((u) => u._id);

      const searchConditions = [
        { rollNo: { $regex: s, $options: 'i' } },
        { enrollmentNo: { $regex: s, $options: 'i' } },
        { user: { $in: userIds } },
      ];

      if (query.$or) {
        query.$and = [{ $or: query.$or }, { $or: searchConditions }];
        delete query.$or;
      } else {
        query.$or = searchConditions;
      }
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(Math.max(1, parseInt(limit, 10) || 20), 100);
    const skip = (pageNum - 1) * limitNum;

    let profileQuery = StudentProfile.find(query);
    if (req.user.role === 'faculty') {
      profileQuery = profileQuery.select('user enrollmentNo rollNo department semester section batchYear');
    }

    const [profiles, totalCount] = await Promise.all([
      profileQuery
        .populate('user', 'name email phone avatar isActive')
        .populate('department', 'name code')
        .sort({ rollNo: 1 })
        .skip(skip)
        .limit(limitNum),
      StudentProfile.countDocuments(query),
    ]);

    res.json({
      success: true,
      count: profiles.length,
      total: totalCount,
      page: pageNum,
      pages: Math.ceil(totalCount / limitNum),
      data: profiles,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === 'production' ? 'An unexpected server error occurred' : error.message,
    });
  }
};

// @desc    Get complete course & cohort roster for attendance and examinations (unpaginated)
// @route   GET /api/students/roster
// @access  Private (Admin, Faculty, Accountant)
export const getStudentRoster = async (req, res) => {
  try {
    const { department, semester, section, courseId } = req.query;
    const query = {};

    if (courseId) {
      const course = await Course.findById(courseId);
      if (course) {
        query.department = course.department;
        query.semester = course.semester;
      }
    }

    if (department) query.department = department;
    if (semester) query.semester = Number(semester);
    if (section && section !== 'all') query.section = section;

    if (req.user.role === 'faculty') {
      const assignedCourses = await Course.find({ faculty: req.user._id }).select('department semester');
      const assignments = assignedCourses.map((c) => ({ department: c.department, semester: c.semester }));
      if (assignments.length > 0) {
        if (query.department && query.semester) {
          const isAssigned = assignments.some(
            (a) => a.department.toString() === query.department.toString() && a.semester === query.semester
          );
          if (!isAssigned) {
            return res.status(403).json({ success: false, message: 'You can only view rosters for your assigned courses' });
          }
        } else {
          query.$or = assignments;
        }
      } else {
        return res.json({ success: true, count: 0, data: [] });
      }
    }

    const profiles = await StudentProfile.find(query)
      .populate({
        path: 'user',
        match: { isActive: { $ne: false } },
        select: 'name email phone avatar isActive',
      })
      .populate('department', 'name code')
      .sort({ rollNo: 1, enrollmentNo: 1 })
      .lean();

    const activeRoster = profiles.filter((p) => p.user);

    res.json({
      success: true,
      count: activeRoster.length,
      data: activeRoster,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === 'production' ? 'An unexpected server error occurred' : error.message,
    });
  }
};

export const getStudentById = async (req, res) => {
  try {
    const paramId = req.params.id;
    const targetUserId = (!paramId || paramId === 'me') ? req.user._id : paramId;
    const isObjectId = mongoose.Types.ObjectId.isValid(targetUserId);

    const query = isObjectId
      ? { $or: [{ _id: targetUserId }, { user: targetUserId }] }
      : { enrollmentNo: String(targetUserId).toUpperCase() };

    const profile = await StudentProfile.findOne(query)
      .populate('user', 'name email phone avatar isActive')
      .populate('department', 'name code');

    if (!profile) return res.status(404).json({ success: false, message: 'Student profile not found' });
    const studentUserId = (profile.user?._id || profile.user || '').toString();

    if (req.user.role === 'student' && studentUserId !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'You can only view your own student record' });
    }
    let facultyCourseIds = [];
    if (req.user.role === 'faculty') {
      const assignedCourses = await Course.find({ faculty: req.user._id, department: profile.department?._id || profile.department, semester: profile.semester }).select('_id');
      facultyCourseIds = assignedCourses.map((course) => course._id);
      const assigned = facultyCourseIds.length > 0;
      if (!assigned) return res.status(403).json({ success: false, message: 'You can only view students in your assigned courses' });
    }

    // Fetch student's attendance summary, fees, and exams concurrently
    const [attendances, fees, exams] = await Promise.all([
      studentUserId ? Attendance.find({ 'records.student': studentUserId, ...(req.user.role === 'faculty' ? { course: { $in: facultyCourseIds } } : {}) }).populate('course', 'name code') : [],
      studentUserId && req.user.role !== 'faculty' ? Fee.find({ student: studentUserId }).sort({ createdAt: -1 }) : [],
      studentUserId ? Exam.find({ 'results.student': studentUserId, ...(req.user.role === 'faculty' ? { course: { $in: facultyCourseIds } } : {}) }).populate('course', 'name code') : [],
    ]);

    const totalClasses = attendances.length;
    let presentClasses = 0;
    attendances.forEach((att) => {
      const rec = att.records.find((r) => r.student?.toString() === studentUserId);
      if (rec && (rec.status === 'Present' || rec.status === 'Late')) presentClasses++;
    });
    const attendancePercentage = totalClasses > 0 ? ((presentClasses / totalClasses) * 100).toFixed(1) : 100;

    const examResults = exams.map((exam) => {
      const r = exam.results.find((result) => result.student?.toString() === studentUserId);
      return {
        examTitle: exam.title,
        course: exam.course,
        examType: exam.examType,
        maxMarks: exam.maxMarks,
        marksObtained: r ? r.marksObtained : 0,
        grade: r ? r.grade : 'N/A',
      };
    });

    res.json({
      success: true,
      data: {
        profile,
        attendanceStats: { totalClasses, presentClasses, attendancePercentage: Number(attendancePercentage) },
        fees,
        examResults,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === 'production' ? 'An unexpected server error occurred' : error.message,
    });
  }
};

export const updateStudentProfile = async (req, res) => {
  try {
    const { name, phone, semester, section, batchYear, guardianName, guardianPhone, address } = req.body;
    const profile = await StudentProfile.findById(req.params.id);
    if (!profile) return res.status(404).json({ success: false, message: 'Student not found' });

    const userUpdate = {};
    if (name) userUpdate.name = name;
    if (phone !== undefined) userUpdate.phone = phone;
    if (Object.keys(userUpdate).length > 0 && profile.user) {
      await User.findByIdAndUpdate(profile.user, userUpdate);
    }

    if (semester) profile.semester = semester;
    if (section) profile.section = section;
    if (batchYear) profile.batchYear = batchYear;
    if (guardianName !== undefined) profile.guardianName = guardianName;
    if (guardianPhone !== undefined) profile.guardianPhone = guardianPhone;
    if (address !== undefined) profile.address = address;

    await profile.save();
    const updated = await StudentProfile.findById(profile._id)
      .populate('user', 'name email phone avatar')
      .populate('department', 'name code');

    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteStudent = async (req, res) => {
  try {
    const profile = await StudentProfile.findById(req.params.id);
    if (!profile) return res.status(404).json({ success: false, message: 'Student not found' });

    const studentUserId = profile.user;

    // Deactivate user account to preserve financial ledger and historical invoices
    if (studentUserId) {
      await User.findByIdAndUpdate(studentUserId, { isActive: false });
    }

    // Remove active student profile and prune active attendance/exams with targeted query
    await Promise.all([
      StudentProfile.findByIdAndDelete(req.params.id),
      studentUserId
        ? Attendance.updateMany(
            { 'records.student': studentUserId },
            { $pull: { records: { student: studentUserId } } }
          )
        : Promise.resolve(),
      studentUserId
        ? Exam.updateMany(
            { 'results.student': studentUserId },
            { $pull: { results: { student: studentUserId } } }
          )
        : Promise.resolve(),
    ]);

    recordAudit({
      user: req.user,
      action: 'DEACTIVATE_STUDENT',
      resource: 'StudentProfile',
      resourceId: req.params.id,
      ip: req.ip,
      details: { enrollmentNo: profile.enrollmentNo, rollNo: profile.rollNo },
    });

    res.json({
      success: true,
      message: 'Student deactivated and removed from active roster. Financial and fee records preserved for accounting audit.',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to process student deactivation' });
  }
};
