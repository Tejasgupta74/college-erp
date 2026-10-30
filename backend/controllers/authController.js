import crypto from 'crypto';
import User from '../models/User.js';
import StudentProfile from '../models/StudentProfile.js';
import FacultyProfile from '../models/FacultyProfile.js';
import Department from '../models/Department.js';
import { generateToken } from '../utils/generateToken.js';

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
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: 'Please provide email and password' });

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    if (!user.isActive) return res.status(403).json({ success: false, message: 'Your account has been deactivated. Contact Admin.' });

    const profile = await getProfileForUser(user);
    const token = generateToken(user._id);

    // Set secure HTTP-only cookie
    const isProd = process.env.NODE_ENV === 'production';
    res.cookie('token', token, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'strict' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({ success: true, token, user: formatUserResponse(user, profile) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
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
    res.status(500).json({ success: false, message: error.message });
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

    if (await User.findOne({ email })) return res.status(400).json({ success: false, message: 'User with this email already exists' });

    const user = await User.create({ name, email, password: password || 'College@123', role, phone });
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
    await user.save();
    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Register a new student account (Public self-registration)
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role = 'student',
      phone = '',
      departmentId,
      enrollmentNo,
      rollNo,
      semester = 1,
      section = 'A',
      batchYear = '2024-2028',
      guardianName = '',
      guardianPhone = '',
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide name, email, and password' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const existing = await User.findOne({ email: cleanEmail });
    if (existing) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists' });
    }

    let dept = null;
    if (departmentId) {
      dept = await Department.findById(departmentId);
    }
    if (!dept) {
      dept = await Department.findOne();
    }
    if (!dept) {
      return res.status(500).json({ success: false, message: 'System setup incomplete: No academic department available' });
    }

    const userRole = role === 'faculty' ? 'faculty' : 'student';

    const user = await User.create({
      name: name.trim(),
      email: cleanEmail,
      password,
      role: userRole,
      phone: phone?.trim() || '',
    });

    let profile = null;
    try {
      if (userRole === 'student') {
        const genEnrollment = enrollmentNo?.trim() || `ENR${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
        const genRoll = rollNo?.trim() || `R${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
        profile = await StudentProfile.create({
          user: user._id,
          enrollmentNo: genEnrollment,
          rollNo: genRoll,
          department: dept._id,
          semester: Number(semester) || 1,
          section: section || 'A',
          batchYear: batchYear || '2024-2028',
          guardianName: guardianName || '',
          guardianPhone: guardianPhone || '',
        });
      } else {
        const genEmp = `EMP${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
        profile = await FacultyProfile.create({
          user: user._id,
          employeeId: genEmp,
          department: dept._id,
          designation: 'Assistant Professor',
          qualification: 'Post Graduate',
        });
      }
    } catch (profileErr) {
      await User.findByIdAndDelete(user._id);
      throw profileErr;
    }

    const populatedProfile = await getProfileForUser(user);
    const token = generateToken(user._id);

    const isProd = process.env.NODE_ENV === 'production';
    res.cookie('token', token, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'strict' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful! Welcome to College ERP System.',
      token,
      user: formatUserResponse(user, populatedProfile),
    });
  } catch (error) {
    const clientError = error.code === 11000 || ['ValidationError', 'CastError'].includes(error.name);
    res.status(clientError ? 400 : 500).json({ success: false, message: error.message });
  }
};

// @desc    Get public departments list for registration
// @route   GET /api/auth/departments
// @access  Public
export const getPublicDepartments = async (req, res) => {
  try {
    const departments = await Department.find().select('_id name code description').lean();
    res.json({ success: true, departments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Reset Password directly with email and new password (no tokens needed)
// @route   POST /api/auth/reset-password or /api/auth/forgot-password
// @access  Public
export const resetPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    if (!email || !newPassword) {
      return res.status(400).json({ success: false, message: 'Please provide your registered email and new password' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters long' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(404).json({ success: false, message: 'No registered user found with this email address' });
    }

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.json({
      success: true,
      message: 'Password reset successfully! You can now log in with your new password.',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const forgotPassword = resetPassword;

// @desc    Logout user & clear cookie
// @route   POST /api/auth/logout
// @access  Public
export const logout = async (req, res) => {
  res.cookie('token', '', {
    httpOnly: true,
    expires: new Date(0),
  });
  res.json({ success: true, message: 'Logged out successfully' });
};
