import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';

import connectDB from './config/db.js';
import logger from './config/logger.js';
import { notFound, errorHandler } from './middlewares/errorHandler.js';
import { requestIdMiddleware } from './middlewares/requestId.js';
import { apiLimiter } from './middlewares/rateLimiter.js';

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

// Validate critical environment secrets
if (!process.env.JWT_SECRET) {
  throw new Error('FATAL: JWT_SECRET must be configured before starting the API');
}
if (process.env.NODE_ENV === 'production' && process.env.JWT_SECRET.length < 32) {
  throw new Error('FATAL: JWT_SECRET must be at least 32 characters long in production');
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(mongoSanitize());
app.use(cookieParser());

const rawAllowedOrigin = process.env.CORS_ORIGIN || process.env.CLIENT_URL || 'http://localhost:3000';
const allowedOrigins = rawAllowedOrigin.split(',').map((o) => o.trim());

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, or server-to-server)
    if (
      !origin ||
      allowedOrigins.includes('*') ||
      allowedOrigins.includes(origin) ||
      origin.endsWith('.onrender.com') ||
      origin.includes('localhost')
    ) {
      return callback(null, true);
    }
    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(requestIdMiddleware);

if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

// Static files & rate limiting
app.use('/uploads', express.static(path.resolve(__dirname, 'uploads'), { maxAge: '7d' }));
app.use('/api', apiLimiter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  const ready = mongoose.connection.readyState === 1;
  res.json({
    status: ready ? 'online' : 'degraded',
    database: ready ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
    system: 'College ERP Enterprise Backend API',
    version: '2.0.0',
    requestId: req.id,
  });
});

// Routes
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

const PORT = process.env.PORT || 8000;
let server;

const startServer = async () => {
  await connectDB();
  server = app.listen(PORT, () => {
    logger.info(`[Server] College ERP backend running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
};

startServer().catch((error) => {
  logger.error(`[Startup Failed]: ${error.message}`, { stack: error.stack });
  process.exit(1);
});

process.on('unhandledRejection', (err) => logger.error(`[Unhandled Rejection]: ${err.message}`, { stack: err.stack }));
process.on('uncaughtException', (err) => {
  logger.error(`[Uncaught Exception]: ${err.message}`, { stack: err.stack });
  if (server) server.close(() => process.exit(1));
  else process.exit(1);
});

// Graceful shutdown handling
const gracefulShutdown = (signal) => {
  logger.info(`[Server] ${signal} signal received: closing HTTP server and database connections`);
  if (server) {
    server.close(async () => {
      logger.info('[Server] HTTP server closed');
      await mongoose.connection.close(false);
      logger.info('[Database] MongoDB connection closed');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export default app;
