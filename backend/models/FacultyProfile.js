import mongoose from 'mongoose';

const facultyProfileSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    employeeId: { type: String, required: [true, 'Employee ID is required'], unique: true, uppercase: true, trim: true },
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
    designation: { type: String, required: true, trim: true }, // e.g. "Professor", "Assistant Professor", "Associate Professor", "HOD"
    qualification: { type: String, default: '' }, // e.g. "Ph.D. in Computer Science, M.Tech"
    specialization: { type: String, default: '' },
    joiningDate: { type: Date, default: Date.now },
    officeRoom: { type: String, default: '' },
  },
  { timestamps: true }
);

const FacultyProfile = mongoose.model('FacultyProfile', facultyProfileSchema);
export default FacultyProfile;
