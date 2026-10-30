import crypto from 'crypto';
import User from '../models/User.js';
import StudentProfile from '../models/StudentProfile.js';
import FacultyProfile from '../models/FacultyProfile.js';
import Department from '../models/Department.js';
import { generateToken } from '../utils/generateToken.js';
import { recordAudit } from '../utils/audit.js';

const getProfileForUser = (user) => {
  if (user.role === 'student') return StudentProfile.findOne({ user: user._id }).populate('department', 'name code');
  if (user.role === 'faculty') return FacultyProfile.findOne({ user: user._id }).populate('department', 'name code');
  return null;
};

const formatUserResponse = (user, profile) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  phone: user.phone,
  avatar: user.avatar,
  profile,
});

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
  try {
    const rawEmail = req.body.email;
    const { password } = req.body;
    if (!rawEmail || !password) return res.status(400).json({ success: false, message: 'Please provide email and password' });

    const email = rawEmail.trim().toLowerCase();
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    if (!user.isActive) return res.status(403).json({ success: false, message: 'Your account has been deactivated. Contact Admin.' });

    const profile = await getProfileForUser(user);
    const token = generateToken(user._id, user.tokenVersion || 0);

    // Set secure HTTP-only cookie
    const isProd = process.env.NODE_ENV === 'production';
    res.cookie('token', token, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'strict' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    recordAudit({
      user,
      action: 'LOGIN_SUCCESS',
      resource: 'User',
      resourceId: user._id,
      ip: req.ip,
      details: { email: user.email, role: user.role },
    });

    res.json({ success: true, token, user: formatUserResponse(user, profile) });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === 'production' ? 'An unexpected server error occurred' : error.message,
    });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const profile = await getProfileForUser(user);
    res.json({ success: true, user: formatUserResponse(user, profile) });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === 'production' ? 'An unexpected server error occurred' : error.message,
    });
  }
};

// @desc    Create new user with role and profile (Admin only)
// @route   POST /api/auth/create-user
// @access  Private/Admin
export const createUser = async (req, res) => {
  try {
    const {
      name, email, password, role, phone = '', departmentId,
      enrollmentNo, rollNo, semester = 1, section = 'A', batchYear = '2024-2028',
      guardianName = '', guardianPhone = '', employeeId, designation = 'Assistant Professor', qualification = 'Post Graduate',
    } = req.body;

    if (!name || !email || !role) return res.status(400).json({ success: false, message: 'Please provide name, email, and role' });
    if ((role === 'student' || role === 'faculty') && !departmentId) {
      return res.status(400).json({ success: false, message: 'Please select a department' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (await User.findOne({ email: normalizedEmail })) return res.status(400).json({ success: false, message: 'User with this email already exists' });

    // Generate secure random temporary password if none provided
    const userPassword = password || `Temp#${crypto.randomBytes(4).toString('hex')}!`;
    const user = await User.create({ name: name.trim(), email: normalizedEmail, password: userPassword, role, phone });
    let profile = null;

    try {
      if (role === 'student') {
        profile = await StudentProfile.create({
          user: user._id,
          enrollmentNo: enrollmentNo || `ENR${crypto.randomBytes(4).toString('hex').toUpperCase()}`,
          rollNo: rollNo || `R${crypto.randomBytes(3).toString('hex').toUpperCase()}`,
          department: departmentId,
          semester, section, batchYear, guardianName, guardianPhone,
        });
      } else if (role === 'faculty') {
        profile = await FacultyProfile.create({
          user: user._id,
          employeeId: employeeId || `EMP${crypto.randomBytes(4).toString('hex').toUpperCase()}`,
          department: departmentId,
          designation, qualification,
        });
      }
    } catch (profileErr) {
      await User.findByIdAndDelete(user._id);
      throw profileErr;
    }

    recordAudit({
      user: req.user,
      action: 'ADMIN_CREATE_USER',
      resource: 'User',
      resourceId: user._id,
      ip: req.ip,
      details: { email: user.email, role: user.role },
    });

    res.status(201).json({
      success: true,
      message: `${role.toUpperCase()} user created successfully`,
      user: { _id: user._id, name: user.name, email: user.email, role: user.role, profile },
    });
  } catch (error) {
    const clientError = error.code === 11000 || ['ValidationError', 'CastError'].includes(error.name);
    res.status(clientError ? 400 : 500).json({ success: false, message: error.message });
  }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Please provide current and new password' });
    }

    const user = await User.findById(req.user._id).select('+password');
    if (!(await user.matchPassword(currentPassword))) {
      return res.status(400).json({ success: false, message: 'Current password does not match' });
    }

    user.password = newPassword;
    user.tokenVersion = (user.tokenVersion || 0) + 1; // Invalidate all prior active sessions
    await user.save();

    // Issue fresh token for current session so user is not logged out
    const newToken = generateToken(user._id, user.tokenVersion);
    const isProd = process.env.NODE_ENV === 'production';
    res.cookie('token', newToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'strict' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    recordAudit({
      user: req.user,
      action: 'CHANGE_PASSWORD',
      resource: 'User',
      resourceId: user._id,
      ip: req.ip,
    });

    res.json({
      success: true,
      message: 'Password updated successfully. Other active sessions revoked.',
      token: newToken,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update password' });
  }
};

// @desc    Generate password reset token & email/return instructions
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res) => {
  try {
    const rawEmail = req.body.email;
    if (!rawEmail) {
      return res.status(400).json({ success: false, message: 'Please provide your registered institutional email' });
    }

    const email = rawEmail.trim().toLowerCase();
    const user = await User.findOne({ email });

    // Respond with generic success to prevent account enumeration
    if (!user) {
      return res.json({
        success: true,
        message: 'If the provided email is registered, password reset instructions have been generated.',
      });
    }

    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    recordAudit({
      user,
      action: 'FORGOT_PASSWORD_REQUESTED',
      resource: 'User',
      resourceId: user._id,
      ip: req.ip,
      details: { email: user.email },
    });

    const isDev = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';

    res.json({
      success: true,
      message: isDev
        ? 'Password reset token generated successfully. Valid for 15 minutes.'
        : 'If the provided email is registered, password reset instructions have been issued. Please contact your administrator if you require assistance.',
      // In development or test environments, include the token for automated testing
      ...(isDev && { resetToken }),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to process forgot password request' });
  }
};

// @desc    Admin Reset Password for any user
// @route   POST /api/auth/admin-reset-password
// @access  Private (Admin only)
export const adminResetPassword = async (req, res) => {
  try {
    const { userId, email, newPassword } = req.body;
    if ((!userId && !email) || !newPassword) {
      return res.status(400).json({ success: false, message: 'Please provide user ID/email and new password' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters long' });
    }

    const query = userId ? { _id: userId } : { email: email.trim().toLowerCase() };
    const user = await User.findOne(query);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    user.tokenVersion = (user.tokenVersion || 0) + 1; // Invalidate all prior sessions
    await user.save();

    recordAudit({
      user: req.user,
      action: 'ADMIN_RESET_PASSWORD',
      resource: 'User',
      resourceId: user._id,
      ip: req.ip,
      details: { targetEmail: user.email },
    });

    res.json({
      success: true,
      message: `Password for ${user.name} (${user.email}) has been reset successfully. Existing sessions revoked.`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to reset user password' });
  }
};

// @desc    Verify cryptographically hashed token & reset password
// @route   POST /api/auth/reset-password
// @access  Public
export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide the password reset token and your new password',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters long' });
    }

    // Hash incoming token to match against sha256 in database
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired password reset token',
      });
    }

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    user.tokenVersion = (user.tokenVersion || 0) + 1; // Invalidate all prior active sessions
    await user.save();

    recordAudit({
      user,
      action: 'PASSWORD_RESET_SUCCESS',
      resource: 'User',
      resourceId: user._id,
      ip: req.ip,
      details: { email: user.email },
    });

    res.json({
      success: true,
      message: 'Password reset successfully! You can now log in with your new password.',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === 'production' ? 'An unexpected server error occurred' : error.message,
    });
  }
};

// @desc    Logout user & clear cookie
// @route   POST /api/auth/logout
// @access  Public
export const logout = async (req, res) => {
  if (req.user) {
    req.user.tokenVersion = (req.user.tokenVersion || 0) + 1;
    await req.user.save();
  }

  res.cookie('token', '', {
    httpOnly: true,
    expires: new Date(0),
  });
  res.json({ success: true, message: 'Logged out successfully' });
};
