import mongoose from 'mongoose';
import StudentProfile from '../models/StudentProfile.js';
import User from '../models/User.js';
import Attendance from '../models/Attendance.js';
import Fee from '../models/Fee.js';
import Exam from '../models/Exam.js';
import Course from '../models/Course.js';
import { recordAudit } from '../utils/audit.js';

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

    let profileQuery = StudentProfile.find(query);
    if (req.user.role === 'faculty') profileQuery = profileQuery.select('user enrollmentNo rollNo department semester section batchYear');
    let profiles = await profileQuery
      .populate('user', 'name email phone avatar isActive')
      .populate('department', 'name code')
      .sort({ rollNo: 1 });

    if (search) {
      const s = search.toLowerCase();
      profiles = profiles.filter((p) =>
        p.user?.name?.toLowerCase().includes(s) ||
        p.user?.email?.toLowerCase().includes(s) ||
        p.rollNo?.toLowerCase().includes(s) ||
        p.enrollmentNo?.toLowerCase().includes(s)
      );
    }

    const totalCount = profiles.length;
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, parseInt(limit, 10));
    const startIndex = (pageNum - 1) * limitNum;
    const paginatedProfiles = profiles.slice(startIndex, startIndex + limitNum);

    res.json({
      success: true,
      count: paginatedProfiles.length,
      total: totalCount,
      page: pageNum,
      pages: Math.ceil(totalCount / limitNum),
      data: paginatedProfiles,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
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
    res.status(500).json({ success: false, message: error.message });
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

    await Promise.all([
      profile.user ? User.findByIdAndDelete(profile.user) : Promise.resolve(),
      StudentProfile.findByIdAndDelete(req.params.id),
    ]);
    res.json({ success: true, message: 'Student deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
