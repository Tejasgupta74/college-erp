import mongoose from 'mongoose';

const noticeSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    targetAudience: { type: String, enum: ['all', 'students', 'faculty', 'accountant'], default: 'all' },
    priority: { type: String, enum: ['Normal', 'Important', 'Urgent'], default: 'Normal' },
    isPinned: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Notice = mongoose.model('Notice', noticeSchema);
export default Notice;
