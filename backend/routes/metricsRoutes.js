import express from 'express';
import mongoose from 'mongoose';
import os from 'os';
import { cache } from '../config/cache.js';
import { protect, authorize } from '../middlewares/auth.js';

const router = express.Router();

// GET /api/metrics - System telemetry & observability (Admin only)
router.get('/', protect, authorize('admin'), (req, res) => {
  const mem = process.memoryUsage();
  res.json({
    success: true,
    data: {
      timestamp: new Date().toISOString(),
      service: 'college-erp-backend',
      environment: process.env.NODE_ENV || 'development',
      system: {
        uptimeSeconds: Math.floor(process.uptime()),
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        systemFreeMemMb: Math.round(os.freemem() / (1024 * 1024)),
        systemTotalMemMb: Math.round(os.totalmem() / (1024 * 1024)),
        cpuCount: os.cpus().length,
      },
      memoryUsageMb: {
        rss: Math.round(mem.rss / (1024 * 1024)),
        heapTotal: Math.round(mem.heapTotal / (1024 * 1024)),
        heapUsed: Math.round(mem.heapUsed / (1024 * 1024)),
        external: Math.round(mem.external / (1024 * 1024)),
      },
      database: {
        status: mongoose.connection.readyState === 1 ? 'CONNECTED' : 'DISCONNECTED',
        name: mongoose.connection.name,
        host: mongoose.connection.host,
        port: mongoose.connection.port,
      },
      cache: cache.getMetrics(),
    },
  });
});

export default router;
