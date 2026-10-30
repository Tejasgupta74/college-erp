import express from 'express';
import {
  login,
  logout,
  getMe,
  createUser,
  changePassword,
  forgotPassword,
  resetPassword,
} from '../controllers/authController.js';
import { protect, authorize } from '../middlewares/auth.js';
import { authLimiter, sensitiveLimiter } from '../middlewares/rateLimiter.js';

const router = express.Router();

router.post('/login', authLimiter, login);
router.post('/logout', logout);
router.post('/forgot-password', sensitiveLimiter, forgotPassword);
router.post('/reset-password', sensitiveLimiter, resetPassword);
router.get('/me', protect, getMe);
router.post('/create-user', protect, authorize('admin'), createUser);
router.put('/change-password', protect, sensitiveLimiter, changePassword);

export default router;
