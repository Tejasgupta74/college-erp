import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Please provide a name'], trim: true },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/, 'Please provide a valid email address'],
    },
    password: { type: String, required: [true, 'Please provide a password'], minlength: 6, select: false },
    role: { type: String, enum: ['admin', 'faculty', 'student', 'accountant'], default: 'student' },
    phone: { type: String, default: '' },
    avatar: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
    resetPasswordToken: { type: String },
    resetPasswordExpire: { type: Date },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, await bcrypt.genSalt(10));
  next();
});

// Compare password method
userSchema.methods.matchPassword = function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

userSchema.index({ role: 1, isActive: 1 });
userSchema.index({ resetPasswordToken: 1 });

const User = mongoose.model('User', userSchema);
export default User;
