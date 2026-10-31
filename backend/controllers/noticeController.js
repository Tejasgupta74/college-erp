import Notice from '../models/Notice.js';
import { invalidateCache } from '../config/cache.js';
import { broadcastNotification } from '../services/notificationService.js';
import { recordAudit } from '../utils/audit.js';
import { parsePaginationParams } from '../utils/pagination.js';

export const getNotices = async (req, res) => {
  try {
    const pagination = parsePaginationParams(req.query, 20, 100);
    if (pagination.error) {
      return res.status(400).json({ success: false, message: pagination.error });
    }
    const { pageNum, limitNum, skip } = pagination;

    const roleAudience = req.user.role === 'student' ? ['student', 'students'] : [req.user.role];
    const query = req.user.role === 'admin'
      ? {}
      : { targetAudience: { $in: ['all', ...roleAudience] } };

    const [notices, totalCount] = await Promise.all([
      Notice.find(query)
        .populate('author', 'name role')
        .sort({ isPinned: -1, createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Notice.countDocuments(query),
    ]);

    res.json({
      success: true,
      count: notices.length,
      total: totalCount,
      page: pageNum,
      pages: Math.ceil(totalCount / limitNum),
      data: notices,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === 'production' ? 'An unexpected server error occurred' : error.message,
    });
  }
};

export const createNotice = async (req, res) => {
  try {
    const { title, content, targetAudience = 'all', priority = 'Normal', isPinned = false } = req.body;
    const notice = await Notice.create({ title, content, author: req.user._id, targetAudience, priority, isPinned });

    invalidateCache('erp:/api/notices*');
    broadcastNotification({ role: targetAudience, title: `Notice: ${title}`, message: content.slice(0, 120), category: 'ANNOUNCEMENT', link: '/notices' });
    recordAudit({ user: req.user, action: 'PUBLISH_NOTICE', resource: 'Notice', resourceId: notice._id, ip: req.ip, details: { title, priority, targetAudience } });

    const populated = await Notice.findById(notice._id).populate('author', 'name role');
    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteNotice = async (req, res) => {
  try {
    const notice = await Notice.findByIdAndDelete(req.params.id);
    if (!notice) return res.status(404).json({ success: false, message: 'Notice not found' });

    invalidateCache('erp:/api/notices*');
    recordAudit({ user: req.user, action: 'DELETE_NOTICE', resource: 'Notice', resourceId: req.params.id, ip: req.ip });
    res.json({ success: true, message: 'Notice deleted successfully' });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === 'production' ? 'An unexpected server error occurred' : error.message,
    });
  }
};
