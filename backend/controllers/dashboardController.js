import Department from '../models/Department.js';
import Course from '../models/Course.js';
import StudentProfile from '../models/StudentProfile.js';
import FacultyProfile from '../models/FacultyProfile.js';
import Fee from '../models/Fee.js';
import Notice from '../models/Notice.js';
import Attendance from '../models/Attendance.js';
import Exam from '../models/Exam.js';

export const getDashboardStats = async (req, res) => {
  try {
    const { role, _id: userId } = req.user;

    if (role === 'admin') {
      const [totalStudents, totalFaculty, totalDepartments, totalCourses, feeData, recentNotices, deptDist, feeMonthly] =
        await Promise.all([
          StudentProfile.countDocuments(),
          FacultyProfile.countDocuments(),
          Department.countDocuments(),
          Course.countDocuments(),
          Fee.aggregate([{ $group: { _id: null, totalBilled: { $sum: '$totalAmount' }, totalCollected: { $sum: '$paidAmount' } } }]),
          Notice.find().sort({ createdAt: -1 }).limit(5).populate('author', 'name role'),
          Department.aggregate([
            { $lookup: { from: 'studentprofiles', localField: '_id', foreignField: 'department', as: 'students' } },
            { $project: { name: '$code', count: { $size: '$students' } } },
          ]),
          Fee.aggregate([
            { $unwind: '$payments' },
            {
              $group: {
                _id: { $dateToString: { format: '%b %Y', date: '$payments.date' } },
                collected: { $sum: '$payments.amount' },
              },
            },
            { $limit: 6 },
          ]),
        ]);

      const totalBilled = feeData[0]?.totalBilled || 0;
      const totalCollected = feeData[0]?.totalCollected || 0;

      return res.json({
        success: true,
        data: {
          role: 'admin',
          metrics: { totalStudents, totalFaculty, totalDepartments, totalCourses, totalBilled, totalCollected, totalPending: totalBilled - totalCollected },
          recentNotices,
          analytics: {
            deptDistribution: deptDist.map(d => ({ name: d.name || 'Dept', students: d.count })),
            feeMonthly: feeMonthly.map(f => ({ month: f._id, amount: f.collected })),
          },
        },
      });
    }

    if (role === 'faculty') {
      const [assignedCourses, recentAttendance, recentNotices, classesConducted, attendanceLogs] = await Promise.all([
        Course.find({ faculty: userId }).populate('department', 'name code'),
        Attendance.find({ faculty: userId }).sort({ date: -1 }).limit(5).populate('course', 'name code'),
        Notice.find({ targetAudience: { $in: ['all', 'faculty'] } }).sort({ createdAt: -1 }).limit(5),
        Attendance.countDocuments({ faculty: userId }),
        Attendance.find({ faculty: userId }).sort({ date: -1 }).limit(10).populate('course', 'code'),
      ]);

      const attendanceTrend = attendanceLogs.reverse().map((att) => {
        const total = att.records.length;
        const present = att.records.filter((r) => r.status === 'Present' || r.status === 'Late').length;
        return {
          session: `${att.course?.code || 'Course'} (${new Date(att.date).toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' })})`,
          rate: total > 0 ? Math.round((present / total) * 100) : 0,
        };
      });

      return res.json({
        success: true,
        data: {
          role: 'faculty',
          metrics: { assignedCoursesCount: assignedCourses.length, classesConducted },
          assignedCourses, recentAttendance, recentNotices,
          analytics: { attendanceTrend },
        },
      });
    }

    if (role === 'student') {
      const [profile, fees, recentNotices, sessions, exams] = await Promise.all([
        StudentProfile.findOne({ user: userId }).populate('department', 'name code'),
        Fee.find({ student: userId }),
        Notice.find({ targetAudience: { $in: ['all', 'students'] } }).sort({ createdAt: -1 }).limit(5),
        Attendance.find({ 'records.student': userId.toString() }).populate('course', 'name code'),
        Exam.find({ 'results.student': userId.toString() }).populate('course', 'name code'),
      ]);

      const totalFeeDue = fees.reduce((sum, f) => sum + f.totalAmount, 0);
      const totalFeePaid = fees.reduce((sum, f) => sum + f.paidAmount, 0);

      let presentCount = 0;
      const courseAttendanceMap = {};
      sessions.forEach((s) => {
        const cCode = s.course?.code || 'Course';
        if (!courseAttendanceMap[cCode]) courseAttendanceMap[cCode] = { total: 0, attended: 0 };
        courseAttendanceMap[cCode].total++;
        const r = s.records.find((rec) => rec.student.toString() === userId.toString());
        if (r && (r.status === 'Present' || r.status === 'Late')) {
          presentCount++;
          courseAttendanceMap[cCode].attended++;
        }
      });
      const attendancePercent = sessions.length > 0 ? ((presentCount / sessions.length) * 100).toFixed(1) : '100.0';

      const courseAttendanceStats = Object.keys(courseAttendanceMap).map((k) => ({
        subject: k,
        percentage: Math.round((courseAttendanceMap[k].attended / courseAttendanceMap[k].total) * 100),
      }));

      const gradeStats = exams.map((ex) => {
        const r = ex.results.find((res) => res.student.toString() === userId.toString());
        return {
          subject: ex.course?.code || ex.title,
          score: r ? r.marksObtained : 0,
          max: ex.maxMarks || 100,
        };
      });

      return res.json({
        success: true,
        data: {
          role: 'student',
          profile,
          metrics: {
            attendancePercent: Number(attendancePercent),
            isAttendanceShortage: Number(attendancePercent) < 75,
            totalClassesAttended: `${presentCount}/${sessions.length}`,
            feePending: totalFeeDue - totalFeePaid,
            feePaid: totalFeePaid,
          },
          recentNotices,
          analytics: {
            courseAttendance: courseAttendanceStats,
            performance: gradeStats,
          },
        },
      });
    }

    // Default: accountant
    const [feeData, pendingInvoices, paidInvoices, paymentMethods] = await Promise.all([
      Fee.aggregate([{ $group: { _id: null, totalBilled: { $sum: '$totalAmount' }, totalCollected: { $sum: '$paidAmount' } } }]),
      Fee.countDocuments({ status: { $in: ['Pending', 'Partial'] } }),
      Fee.countDocuments({ status: 'Paid' }),
      Fee.aggregate([
        { $unwind: '$payments' },
        { $group: { _id: '$payments.method', total: { $sum: '$payments.amount' } } },
      ]),
    ]);

    const totalBilled = feeData[0]?.totalBilled || 0;
    const totalCollected = feeData[0]?.totalCollected || 0;

    res.json({
      success: true,
      data: {
        role: 'accountant',
        metrics: { totalBilled, totalCollected, pendingInvoices, paidInvoices },
        analytics: {
          paymentChannels: paymentMethods.map((p) => ({ method: p._id || 'Online', value: p.total })),
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
