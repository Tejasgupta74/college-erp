import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  const auth = req.headers.authorization;
  if (auth?.startsWith('Bearer')) {
    try {
      const decoded = jwt.verify(auth.split(' ')[1], process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
      if (!req.user) return res.status(401).json({ success: false, message: 'User not found with this token' });
      if (!req.user.isActive) return res.status(403).json({ success: false, message: 'Account is deactivated' });
      return next();
    } catch (error) {
      console.error('[Auth Error]', error.message);
      return res.status(401).json({ success: false, message: 'Not authorized, token invalid or expired' });
    }
  }
  return res.status(401).json({ success: false, message: 'Not authorized, no token provided' });
};

export const authorize = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ success: false, message: 'Not authorized' });
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: `Role '${req.user.role}' is not authorized to access this resource`,
    });
  }
  next();
};
