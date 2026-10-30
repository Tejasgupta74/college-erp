import mongoose from 'mongoose';

const studentProfileSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    enrollmentNo: { type: String, required: [true, 'Enrollment number is required'], unique: true, uppercase: true, trim: true },
    rollNo: { type: String, required: [true, 'Roll number is required'], unique: true, trim: true },
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
    semester: { type: Number, required: true, min: 1, max: 8, default: 1 },
    section: { type: String, default: 'A', trim: true },
    batchYear: { type: String, required: true }, // e.g. "2024-2028"
    guardianName: { type: String, default: '' },
    guardianPhone: { type: String, default: '' },
    address: { type: String, default: '' },
    dateOfBirth: { type: Date, default: null },
    bloodGroup: { type: String, default: '' },
  },
  { timestamps: true }
);

studentProfileSchema.index({ department: 1, semester: 1, section: 1 });

const StudentProfile = mongoose.model('StudentProfile', studentProfileSchema);
export default StudentProfile;
