import Department from '../models/Department.js';
import Course from '../models/Course.js';
import StudentProfile from '../models/StudentProfile.js';
import FacultyProfile from '../models/FacultyProfile.js';
import Fee from '../models/Fee.js';
import Notice from '../models/Notice.js';
import Attendance from '../models/Attendance.js';

export const getDashboardStats = async (req, res) => {
  try {
    const { role, _id: userId } = req.user;

    if (role === 'admin') {
      const [totalStudents, totalFaculty, totalDepartments, totalCourses, feeData, recentNotices] =
        await Promise.all([
          StudentProfile.countDocuments(),
          FacultyProfile.countDocuments(),
          Department.countDocuments(),
          Course.countDocuments(),
          Fee.aggregate([{ $group: { _id: null, totalBilled: { $sum: '$totalAmount' }, totalCollected: { $sum: '$paidAmount' } } }]),
          Notice.find().sort({ createdAt: -1 }).limit(5).populate('author', 'name role'),
        ]);

      const totalBilled = feeData[0]?.totalBilled || 0;
      const totalCollected = feeData[0]?.totalCollected || 0;

      return res.json({
        success: true,
        data: {
          role: 'admin',
          metrics: { totalStudents, totalFaculty, totalDepartments, totalCourses, totalBilled, totalCollected, totalPending: totalBilled - totalCollected },
          recentNotices,
        },
      });
    }

    if (role === 'faculty') {
      const [assignedCourses, recentAttendance, recentNotices, classesConducted] = await Promise.all([
        Course.find({ faculty: userId }).populate('department', 'name code'),
        Attendance.find({ faculty: userId }).sort({ date: -1 }).limit(5).populate('course', 'name code'),
        Notice.find({ targetAudience: { $in: ['all', 'faculty'] } }).sort({ createdAt: -1 }).limit(5),
        Attendance.countDocuments({ faculty: userId }),
      ]);

      return res.json({
        success: true,
        data: {
          role: 'faculty',
          metrics: { assignedCoursesCount: assignedCourses.length, classesConducted },
          assignedCourses, recentAttendance, recentNotices,
        },
      });
    }

    if (role === 'student') {
      const [profile, fees, recentNotices, sessions] = await Promise.all([
        StudentProfile.findOne({ user: userId }).populate('department', 'name code'),
        Fee.find({ student: userId }),
        Notice.find({ targetAudience: { $in: ['all', 'students'] } }).sort({ createdAt: -1 }).limit(5),
        Attendance.find({ 'records.student': userId.toString() }),
      ]);

      const totalFeeDue = fees.reduce((sum, f) => sum + f.totalAmount, 0);
      const totalFeePaid = fees.reduce((sum, f) => sum + f.paidAmount, 0);

      let presentCount = 0;
      sessions.forEach((s) => {
        const r = s.records.find((rec) => rec.student.toString() === userId.toString());
        if (r && (r.status === 'Present' || r.status === 'Late')) presentCount++;
      });
      const attendancePercent = sessions.length > 0 ? ((presentCount / sessions.length) * 100).toFixed(1) : '100.0';

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
        },
      });
    }

    // Default: accountant
    const [feeData, pendingInvoices, paidInvoices] = await Promise.all([
      Fee.aggregate([{ $group: { _id: null, totalBilled: { $sum: '$totalAmount' }, totalCollected: { $sum: '$paidAmount' } } }]),
      Fee.countDocuments({ status: { $in: ['Pending', 'Partial'] } }),
      Fee.countDocuments({ status: 'Paid' }),
    ]);

    const totalBilled = feeData[0]?.totalBilled || 0;
    const totalCollected = feeData[0]?.totalCollected || 0;

    res.json({
      success: true,
      data: {
        role: 'accountant',
        metrics: { totalBilled, totalCollected, pendingInvoices, paidInvoices },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
