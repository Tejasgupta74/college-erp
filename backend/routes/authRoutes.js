import express from 'express';
import { login, getMe, createUser, changePassword } from '../controllers/authController.js';
import { protect, authorize } from '../middlewares/auth.js';
import { authLimiter, sensitiveLimiter } from '../middlewares/rateLimiter.js';

const router = express.Router();

router.post('/login', authLimiter, login);
router.get('/me', protect, getMe);
router.post('/create-user', protect, authorize('admin'), createUser);
router.put('/change-password', protect, sensitiveLimiter, changePassword);

export default router;
