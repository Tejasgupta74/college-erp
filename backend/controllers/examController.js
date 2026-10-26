import Exam from '../models/Exam.js';
import Course from '../models/Course.js';

// Grade calculation helper
const calculateGrade = (marksObtained, maxMarks) => {
  const percentage = (marksObtained / maxMarks) * 100;
  if (percentage >= 90) return 'A+';
  if (percentage >= 80) return 'A';
  if (percentage >= 70) return 'B';
  if (percentage >= 60) return 'C';
  if (percentage >= 50) return 'D';
  if (percentage >= 40) return 'P';
  return 'F';
};

export const getExams = async (req, res) => {
  try {
    const { courseId, departmentId, semester } = req.query;
    const query = {};
    if (courseId) query.course = courseId;
    if (departmentId) query.department = departmentId;
    if (semester) query.semester = Number(semester);

    const exams = await Exam.find(query)
      .populate('course', 'name code credits')
      .populate('department', 'name code')
      .populate('results.student', 'name email')
      .sort({ examDate: -1 });

    res.json({ success: true, count: exams.length, data: exams });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createExam = async (req, res) => {
  try {
    const {
      title, courseId, departmentId, semester,
      examType = 'Internal/Mid-Term', maxMarks = 100, passingMarks = 40, examDate = new Date(),
    } = req.body;

    const exam = await Exam.create({
      title,
      course: courseId,
      department: departmentId,
      semester,
      examType,
      maxMarks,
      passingMarks,
      examDate,
      results: [],
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
    const { results } = req.body; // array of { studentId, marksObtained, remarks }
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });

    exam.results = results.map((r) => ({
      student: r.studentId,
      marksObtained: Number(r.marksObtained),
      grade: calculateGrade(Number(r.marksObtained), exam.maxMarks),
      remarks: r.remarks || '',
    }));

    await exam.save();

    const updated = await Exam.findById(exam._id)
      .populate('course', 'name code credits')
      .populate('department', 'name code')
      .populate('results.student', 'name email');

    res.json({ success: true, message: 'Marks recorded successfully', data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getStudentReportCard = async (req, res) => {
  try {
    const studentId = (req.params.studentId || req.user._id).toString();

    const exams = await Exam.find({ 'results.student': studentId })
      .populate('course', 'name code credits')
      .populate('department', 'name code');

    const reportCard = exams.map((exam) => {
      const r = exam.results.find((result) => result.student.toString() === studentId);
      return {
        examId: exam._id,
        examTitle: exam.title,
        examType: exam.examType,
        courseName: exam.course?.name,
        courseCode: exam.course?.code,
        credits: exam.course?.credits || 3,
        maxMarks: exam.maxMarks,
        marksObtained: r ? r.marksObtained : 0,
        percentage: r ? ((r.marksObtained / exam.maxMarks) * 100).toFixed(1) : '0.0',
        grade: r ? r.grade : 'F',
        isPassed: r ? r.marksObtained >= exam.passingMarks : false,
      };
    });

    res.json({ success: true, data: reportCard });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
