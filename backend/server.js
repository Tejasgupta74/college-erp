import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import path from 'path';

import connectDB from './config/db.js';
import logger from './config/logger.js';
import { notFound, errorHandler } from './middlewares/errorHandler.js';
import { requestIdMiddleware } from './middlewares/requestId.js';
import { apiLimiter } from './middlewares/rateLimiter.js';

// Route imports
import authRoutes from './routes/authRoutes.js';
import academicRoutes from './routes/academicRoutes.js';
import studentRoutes from './routes/studentRoutes.js';
import facultyRoutes from './routes/facultyRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import feeRoutes from './routes/feeRoutes.js';
import examRoutes from './routes/examRoutes.js';
import noticeRoutes from './routes/noticeRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import metricsRoutes from './routes/metricsRoutes.js';

dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Security HTTP headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// Prevent NoSQL query injection
app.use(mongoSanitize());

// CORS configuration
app.use(
  cors({
    origin: process.env.CLIENT_URL || '*',
    credentials: true,
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request correlation ID and structured logger
app.use(requestIdMiddleware);

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Serve uploaded files with cache headers
app.use('/uploads', express.static(path.resolve('uploads'), { maxAge: '7d' }));

// Global API rate limiting
app.use('/api', apiLimiter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    system: 'College ERP Enterprise Backend API',
    version: '2.0.0',
    requestId: req.id,
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/academics', academicRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/faculty', facultyRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/fees', feeRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/notices', noticeRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/metrics', metricsRoutes);

// Error Middlewares
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  logger.info(`[Server] College ERP backend running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

// Process safety: Unhandled rejections & uncaught exceptions
process.on('unhandledRejection', (err) => {
  logger.error(`[Unhandled Rejection]: ${err.message}`, { stack: err.stack });
});

process.on('uncaughtException', (err) => {
  logger.error(`[Uncaught Exception]: ${err.message}`, { stack: err.stack });
  // Graceful shutdown
  server.close(() => process.exit(1));
});

export default app;
