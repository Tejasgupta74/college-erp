import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Course name is required'], trim: true },
    code: { type: String, required: [true, 'Course code is required'], unique: true, uppercase: true, trim: true },
    credits: { type: Number, required: [true, 'Credits are required'], min: 1, max: 10, default: 3 },
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: [true, 'Department is required'] },
    semester: { type: Number, required: [true, 'Semester number is required'], min: 1, max: 8 },
    type: { type: String, enum: ['Theory', 'Lab', 'Elective', 'Project'], default: 'Theory' },
    faculty: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    description: { type: String, default: '' },
  },
  { timestamps: true }
);

const Course = mongoose.model('Course', courseSchema);
export default Course;
