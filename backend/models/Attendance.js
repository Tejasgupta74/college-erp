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
    dateString: {
      type: String,
      required: true,
      default: () => new Date().toISOString().slice(0, 10),
    },
    semester: { type: Number, required: true },
    section: { type: String, default: 'A' },
    sessionSlot: { type: Number, default: 1 },
    sessionType: {
      type: String,
      enum: ['Lecture', 'Lab', 'Tutorial', 'Seminar', 'Other'],
      default: 'Lecture',
    },
    topicCovered: { type: String, default: '' },
    records: [attendanceRecordSchema],
  },
  { timestamps: true }
);

attendanceSchema.index({ course: 1, dateString: 1, section: 1, sessionSlot: 1 }, { unique: false });
attendanceSchema.index({ course: 1, date: 1, section: 1 }, { unique: false });
attendanceSchema.index({ faculty: 1, createdAt: -1 });
attendanceSchema.index({ 'records.student': 1 });

const Attendance = mongoose.model('Attendance', attendanceSchema);
export default Attendance;
