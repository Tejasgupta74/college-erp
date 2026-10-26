import User from '../models/User.js';
import StudentProfile from '../models/StudentProfile.js';
import FacultyProfile from '../models/FacultyProfile.js';
import { generateToken } from '../utils/generateToken.js';

const getProfileForUser = (user) => {
  if (user.role === 'student') return StudentProfile.findOne({ user: user._id }).populate('department', 'name code');
  if (user.role === 'faculty') return FacultyProfile.findOne({ user: user._id }).populate('department', 'name code');
  return null;
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Your account has been deactivated. Contact Admin.' });
    }

    const profile = await getProfileForUser(user);
    const token = generateToken(user._id);

    res.json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        avatar: user.avatar,
        profile,
      },
    });
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

    res.json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        avatar: user.avatar,
        profile,
      },
    });
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
      guardianName = '', guardianPhone = '',
      employeeId, designation = 'Assistant Professor', qualification = 'Post Graduate',
    } = req.body;

    if (await User.findOne({ email })) {
      return res.status(400).json({ success: false, message: 'User with this email already exists' });
    }

    const user = await User.create({
      name,
      email,
      password: password || 'College@123',
      role,
      phone,
    });

    let profile = null;
    if (role === 'student') {
      profile = await StudentProfile.create({
        user: user._id,
        enrollmentNo: enrollmentNo || `ENR${Date.now().toString().slice(-6)}`,
        rollNo: rollNo || `R${Date.now().toString().slice(-4)}`,
        department: departmentId,
        semester,
        section,
        batchYear,
        guardianName,
        guardianPhone,
      });
    } else if (role === 'faculty') {
      profile = await FacultyProfile.create({
        user: user._id,
        employeeId: employeeId || `EMP${Date.now().toString().slice(-5)}`,
        department: departmentId,
        designation,
        qualification,
      });
    }

    res.status(201).json({
      success: true,
      message: `${role.toUpperCase()} user created successfully`,
      user: { _id: user._id, name: user.name, email: user.email, role: user.role, profile },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
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
