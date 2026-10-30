import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  let token = null;

  // Check Bearer Token in Authorization header
  const auth = req.headers.authorization;
  if (auth?.startsWith('Bearer')) {
    token = auth.split(' ')[1];
  } else if (req.cookies?.token) {
    // Check HttpOnly Cookie fallback
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'User not found with this token' });
    }
    if (!req.user.isActive) {
      return res.status(403).json({ success: false, message: 'Account has been deactivated. Please contact Administration.' });
    }
    return next();
  } catch {
    return res.status(401).json({ success: false, message: 'Not authorized, token invalid or expired' });
  }
};

export const authorize = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ success: false, message: 'Not authorized' });
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ success: false, message: `Role '${req.user.role}' is not authorized to access this resource` });
  }
  next();
};
