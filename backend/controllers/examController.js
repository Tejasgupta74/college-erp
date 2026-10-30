import Exam from '../models/Exam.js';
import Course from '../models/Course.js';
import StudentProfile from '../models/StudentProfile.js';

// Grade calculation helper with division-by-zero protection
const calculateGrade = (marksObtained, maxMarks, passingMarks) => {
  if (!maxMarks || maxMarks <= 0) return 'F';
  if (marksObtained < passingMarks) return 'F';
  const percentage = (marksObtained / maxMarks) * 100;
  if (percentage >= 90) return 'A+';
  if (percentage >= 80) return 'A';
  if (percentage >= 70) return 'B';
  if (percentage >= 60) return 'C';
  if (percentage >= 50) return 'D';
  return 'P';
};

export const getExams = async (req, res) => {
  try {
    const { courseId, departmentId, semester, page = 1, limit = 20 } = req.query;
    const query = {};
    if (courseId) query.course = courseId;
    if (departmentId) query.department = departmentId;
    if (semester) query.semester = Number(semester);
    if (req.user.role === 'faculty') {
      const assignedCourseIds = await Course.find({ faculty: req.user._id }).distinct('_id');
      query.course = { ...(courseId ? { $eq: courseId } : {}), $in: assignedCourseIds };
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(Math.max(1, parseInt(limit, 10) || 20), 100);
    const skip = (pageNum - 1) * limitNum;

    const [exams, totalCount] = await Promise.all([
      Exam.find(query)
        .populate('course', 'name code credits')
        .populate('department', 'name code')
        .populate('results.student', 'name email')
        .sort({ examDate: -1 })
        .skip(skip)
        .limit(limitNum),
      Exam.countDocuments(query),
    ]);

    res.json({
      success: true,
      count: exams.length,
      total: totalCount,
      page: pageNum,
      pages: Math.ceil(totalCount / limitNum),
      data: exams,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === 'production' ? 'An unexpected server error occurred' : error.message,
    });
  }
};

export const createExam = async (req, res) => {
  try {
    const {
      title, courseId,
      examType = 'Internal/Mid-Term', maxMarks = 100, passingMarks = 40, examDate = new Date(),
    } = req.body;

    const course = await Course.findById(courseId);
    if (!course) return res.status(400).json({ success: false, message: 'Please select a valid course' });
    if (req.user.role === 'faculty' && course.faculty?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'You can only schedule exams for your assigned courses' });
    }
    const normalizedMaxMarks = Number(maxMarks);
    const normalizedPassingMarks = Number(passingMarks);
    if (!Number.isFinite(normalizedMaxMarks) || normalizedMaxMarks <= 0 || !Number.isFinite(normalizedPassingMarks) || normalizedPassingMarks < 0 || normalizedPassingMarks > normalizedMaxMarks) {
      return res.status(400).json({ success: false, message: 'Marks must be valid and passing marks cannot exceed maximum marks' });
    }
    const exam = await Exam.create({
      title, course: course._id, department: course.department, semester: course.semester,
      examType, maxMarks: normalizedMaxMarks, passingMarks: normalizedPassingMarks, examDate, results: [],
    });

    const populated = await Exam.findById(exam._id)
      .populate('course', 'name code credits')
      .populate('department', 'name code');

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const recordMarks = async (req, res) => {
  try {
    const { results } = req.body;
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });

    if (!Array.isArray(results) || results.length === 0) {
      return res.status(400).json({ success: false, message: 'Provide at least one student result' });
    }
    const course = await Course.findById(exam.course);
    if (req.user.role === 'faculty' && course?.faculty?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'You can only record marks for your assigned courses' });
    }
    const studentIds = results.map((result) => result?.studentId?.toString());
    if (studentIds.some((id) => !id) || new Set(studentIds).size !== studentIds.length) {
      return res.status(400).json({ success: false, message: 'Results must contain unique student IDs' });
    }
    for (const result of results) {
      const marks = Number(result.marksObtained);
      if (!Number.isFinite(marks) || marks < 0 || marks > exam.maxMarks) {
        return res.status(400).json({ success: false, message: `Marks must be between 0 and ${exam.maxMarks}` });
      }
    }
    const rosterCount = await StudentProfile.countDocuments({
      user: { $in: studentIds }, department: exam.department, semester: exam.semester,
    });
    if (rosterCount !== studentIds.length) {
      return res.status(400).json({ success: false, message: 'Results include students outside this exam cohort' });
    }

    const updatedResults = results.map((r) => ({
      student: r.studentId,
      marksObtained: Number(r.marksObtained),
      grade: calculateGrade(Number(r.marksObtained), exam.maxMarks, exam.passingMarks),
      remarks: r.remarks || '',
    }));
    const byStudent = new Map(exam.results.map((result) => [result.student.toString(), result]));
    updatedResults.forEach((result) => byStudent.set(result.student.toString(), result));
    exam.results = [...byStudent.values()];

    await exam.save();

    const updated = await Exam.findById(exam._id)
      .populate('course', 'name code credits')
      .populate('department', 'name code')
      .populate('results.student', 'name email');

    res.json({ success: true, message: 'Marks recorded successfully', data: updated });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === 'production' ? 'An unexpected server error occurred' : error.message,
    });
  }
};

export const getStudentReportCard = async (req, res) => {
  try {
    let studentId = req.params.studentId;
    if (!studentId || studentId === 'me') {
      studentId = req.user._id.toString();
    } else {
      studentId = studentId.toString();
    }

    if (req.user.role === 'student' && studentId !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'You can only view your own report card' });
    }
    if (!['admin', 'faculty', 'student'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Not authorized to view report cards' });
    }
    if (req.user.role === 'faculty') {
      const assignedCourseIds = await Course.find({ faculty: req.user._id }).distinct('_id');
      const studentExam = await Exam.exists({ course: { $in: assignedCourseIds }, 'results.student': studentId });
      if (!studentExam) return res.status(403).json({ success: false, message: 'You can only view report cards for your assigned courses' });
      const exams = await Exam.find({ course: { $in: assignedCourseIds }, 'results.student': studentId })
        .populate('course', 'name code credits')
        .populate('department', 'name code');
      return res.json({ success: true, data: makeReportCard(exams, studentId) });
    }
    const exams = await Exam.find({ 'results.student': studentId })
      .populate('course', 'name code credits')
      .populate('department', 'name code');

    res.json({ success: true, data: makeReportCard(exams, studentId) });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === 'production' ? 'An unexpected server error occurred' : error.message,
    });
  }
};

const makeReportCard = (exams, studentId) => exams.map((exam) => {
      const r = exam.results.find((result) => result.student.toString() === studentId);
      const marksObtained = r ? r.marksObtained : 0;
      const percentage = r && exam.maxMarks > 0 ? ((marksObtained / exam.maxMarks) * 100).toFixed(1) : '0.0';

      return {
        examId: exam._id,
        examTitle: exam.title,
        examType: exam.examType,
        courseName: exam.course?.name,
        courseCode: exam.course?.code,
        credits: exam.course?.credits || 3,
        maxMarks: exam.maxMarks,
        marksObtained,
        percentage,
        grade: r ? r.grade : 'F',
        isPassed: r ? marksObtained >= exam.passingMarks : false,
      };
    });
