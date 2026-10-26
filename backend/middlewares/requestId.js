import crypto from 'crypto';
import logger from '../config/logger.js';

export const requestIdMiddleware = (req, res, next) => {
  const reqId = req.headers['x-request-id'] || crypto.randomUUID();
  req.id = reqId;
  res.setHeader('X-Request-Id', reqId);

  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      requestId: reqId,
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      durationMs: duration,
      ip: req.ip || req.socket.remoteAddress,
      userId: req.user?._id?.toString() || null,
      role: req.user?.role || 'anonymous',
    };

    if (res.statusCode >= 500) {
      logger.error(`HTTP ${req.method} ${req.originalUrl} ${res.statusCode} (${duration}ms)`, logData);
    } else if (res.statusCode >= 400) {
      logger.warn(`HTTP ${req.method} ${req.originalUrl} ${res.statusCode} (${duration}ms)`, logData);
    } else {
      logger.info(`HTTP ${req.method} ${req.originalUrl} ${res.statusCode} (${duration}ms)`, logData);
    }
  });

  next();
};

export default requestIdMiddleware;
