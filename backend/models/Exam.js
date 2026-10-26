import mongoose from 'mongoose';

const examResultSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    marksObtained: { type: Number, required: true, min: 0 },
    grade: { type: String, default: 'P' },
    remarks: { type: String, default: '' },
  },
  { _id: false }
);

const examSchema = new mongoose.Schema(
  {
    title: { type: String, required: true }, // e.g. "Mid-Term Examination Fall 2026"
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
    semester: { type: Number, required: true },
    examType: {
      type: String,
      enum: ['Internal/Mid-Term', 'Final/End-Term', 'Quiz/Assignment', 'Practical/Lab'],
      default: 'Internal/Mid-Term',
    },
    maxMarks: { type: Number, required: true, default: 100 },
    passingMarks: { type: Number, required: true, default: 40 },
    examDate: { type: Date, required: true },
    results: [examResultSchema],
  },
  { timestamps: true }
);

const Exam = mongoose.model('Exam', examSchema);
export default Exam;
