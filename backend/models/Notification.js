import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true },
    category: { type: String, enum: ['ACADEMIC', 'ATTENDANCE', 'FEE', 'EXAM', 'ANNOUNCEMENT'], default: 'ANNOUNCEMENT' },
    link: { type: String, default: '' },
    isRead: { type: Boolean, default: false, index: true },
    readAt: { type: Date, default: null },
  },
  { timestamps: true }
);

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
