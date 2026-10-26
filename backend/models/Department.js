import mongoose from 'mongoose';

const departmentSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Department name is required'], unique: true, trim: true },
    code: { type: String, required: [true, 'Department code is required'], unique: true, uppercase: true, trim: true },
    description: { type: String, default: '' },
    hod: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

const Department = mongoose.model('Department', departmentSchema);
export default Department;
