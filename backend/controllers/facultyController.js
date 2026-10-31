import mongoose from 'mongoose';
import FacultyProfile from '../models/FacultyProfile.js';
import User from '../models/User.js';
import Course from '../models/Course.js';
import { recordAudit } from '../utils/audit.js';

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const getFaculty = async (req, res) => {
  try {
    const { department, search, page = 1, limit = 20 } = req.query;

    if (department && !mongoose.Types.ObjectId.isValid(department)) {
      return res.status(400).json({ success: false, message: 'Invalid department ID format' });
    }
    if (search !== undefined && typeof search !== 'string') {
      return res.status(400).json({ success: false, message: 'Search parameter must be a string' });
    }

    const query = department ? { department } : {};

    if (search && search.trim()) {
      const s = escapeRegex(search.trim());
      const matchingUsers = await User.find({
        $or: [
          { name: { $regex: s, $options: 'i' } },
          { email: { $regex: s, $options: 'i' } },
        ],
      }).select('_id');
      const userIds = matchingUsers.map((u) => u._id);

      query.$or = [
        { employeeId: { $regex: s, $options: 'i' } },
        { user: { $in: userIds } },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(Math.max(1, parseInt(limit, 10) || 20), 100);
    const skip = (pageNum - 1) * limitNum;

    const [profiles, totalCount] = await Promise.all([
      FacultyProfile.find(query)
        .populate('user', 'name email phone avatar isActive')
        .populate('department', 'name code')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      FacultyProfile.countDocuments(query),
    ]);

    res.json({
      success: true,
      count: profiles.length,
      total: totalCount,
      page: pageNum,
      pages: Math.ceil(totalCount / limitNum),
      data: profiles,
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, message: `Invalid ID format for ${error.path || 'field'}` });
    }
    res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === 'production' ? 'An unexpected server error occurred' : error.message,
    });
  }
};

export const getFacultyById = async (req, res) => {
  try {
    const paramId = req.params.id;
    const targetUserId = (!paramId || paramId === 'me') ? req.user._id : paramId;
    const isObjectId = mongoose.Types.ObjectId.isValid(targetUserId);

    const query = isObjectId
      ? { $or: [{ _id: targetUserId }, { user: targetUserId }] }
      : { employeeId: String(targetUserId).toUpperCase() };

    const profile = await FacultyProfile.findOne(query)
      .populate('user', 'name email phone avatar isActive')
      .populate('department', 'name code');

    if (!profile) return res.status(404).json({ success: false, message: 'Faculty profile not found' });
    const facultyUserId = profile.user?._id || profile.user;
    const assignedCourses = facultyUserId ? await Course.find({ faculty: facultyUserId }).populate('department', 'name code') : [];
    res.json({ success: true, data: { profile, assignedCourses } });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === 'production' ? 'An unexpected server error occurred' : error.message,
    });
  }
};

export const updateFaculty = async (req, res) => {
  try {
    const { name, phone, designation, qualification, specialization, officeRoom } = req.body;
    const profile = await FacultyProfile.findById(req.params.id);
    if (!profile) return res.status(404).json({ success: false, message: 'Faculty not found' });

    const userUpdate = {};
    if (name) userUpdate.name = name;
    if (phone !== undefined) userUpdate.phone = phone;
    if (Object.keys(userUpdate).length > 0 && profile.user) {
      await User.findByIdAndUpdate(profile.user, userUpdate);
    }

    if (designation) profile.designation = designation;
    if (qualification !== undefined) profile.qualification = qualification;
    if (specialization !== undefined) profile.specialization = specialization;
    if (officeRoom !== undefined) profile.officeRoom = officeRoom;

    await profile.save();
    const updated = await FacultyProfile.findById(profile._id)
      .populate('user', 'name email phone avatar')
      .populate('department', 'name code');

    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteFaculty = async (req, res) => {
  try {
    const profile = await FacultyProfile.findById(req.params.id);
    if (!profile) return res.status(404).json({ success: false, message: 'Faculty not found' });

    await Promise.all([
      profile.user ? User.findByIdAndDelete(profile.user) : Promise.resolve(),
      FacultyProfile.findByIdAndDelete(req.params.id),
      profile.user ? Course.updateMany({ faculty: profile.user }, { faculty: null }) : Promise.resolve(),
    ]);
    res.json({ success: true, message: 'Faculty member deleted successfully' });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === 'production' ? 'An unexpected server error occurred' : error.message,
    });
  }
};
