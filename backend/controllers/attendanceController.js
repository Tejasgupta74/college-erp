import Attendance from '../models/Attendance.js';

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

    if (!courseId || !departmentId || !Array.isArray(records)) {
      return res.status(400).json({ success: false, message: 'Please provide course, department, and student records' });
    }

    const { sessionDate, startOfDay, endOfDay } = getDayRange(date);

    // Check if attendance already marked today for this course & section
    let attendance = await Attendance.findOne({
      course: courseId,
      section,
      date: { $gte: startOfDay, $lte: endOfDay },
    });

    if (attendance) {
      attendance.records = records;
      if (topicCovered) attendance.topicCovered = topicCovered;
      attendance.faculty = req.user._id;
      await attendance.save();
    } else {
      attendance = await Attendance.create({
        course: courseId,
        department: departmentId,
        faculty: req.user._id,
        date: sessionDate,
        semester,
        section,
        topicCovered,
        records,
      });
    }

    const populated = await Attendance.findById(attendance._id)
      .populate('course', 'name code')
      .populate('records.student', 'name email');

    res.status(201).json({ success: true, message: 'Attendance saved successfully', data: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
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
      const { startOfDay, endOfDay } = getDayRange(date);
      query.date = { $gte: startOfDay, $lte: endOfDay };
    }

    const records = await Attendance.find(query)
      .populate('course', 'name code')
      .populate('faculty', 'name email')
      .populate('records.student', 'name email')
      .sort({ date: -1 });

    res.json({ success: true, count: records.length, data: records });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get attendance breakdown for a specific student
// @route   GET /api/attendance/student/:studentId
// @access  Private
export const getStudentAttendanceSummary = async (req, res) => {
  try {
    const studentUserId = (req.params.studentId || req.user._id).toString();

    // Fetch all attendance sessions where this student has a record
    const sessions = await Attendance.find({
      'records.student': studentUserId,
    }).populate('course', 'name code credits');

    // Aggregate by course
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
    res.status(500).json({ success: false, message: error.message });
  }
};
