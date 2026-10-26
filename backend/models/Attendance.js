import mongoose from 'mongoose';

const attendanceRecordSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['Present', 'Absent', 'Late', 'Excused'], default: 'Present' },
    remarks: { type: String, default: '' },
  },
  { _id: false }
);

const attendanceSchema = new mongoose.Schema(
  {
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
    faculty: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, required: true, default: Date.now },
    semester: { type: Number, required: true },
    section: { type: String, default: 'A' },
    topicCovered: { type: String, default: '' },
    records: [attendanceRecordSchema],
  },
  { timestamps: true }
);

attendanceSchema.index({ course: 1, date: 1, section: 1 }, { unique: false });

const Attendance = mongoose.model('Attendance', attendanceSchema);
export default Attendance;
