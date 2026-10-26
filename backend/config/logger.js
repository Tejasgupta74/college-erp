import winston from 'winston';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logDir = path.resolve(__dirname, '..', 'logs');
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });

const { combine, timestamp, printf, colorize, json, errors } = winston.format;

const consoleFormat = printf(({ level, message, timestamp, requestId, stack }) => {
  const reqStr = requestId ? ` [${requestId}]` : '';
  return `${timestamp} ${level}${reqStr}: ${stack || message}`;
});

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), errors({ stack: true }), json()),
  defaultMeta: { service: 'college-erp-api' },
  transports: [
    new winston.transports.File({ filename: path.join(logDir, 'error.log'), level: 'error', maxsize: 10485760, maxFiles: 5 }),
    new winston.transports.File({ filename: path.join(logDir, 'combined.log'), maxsize: 10485760, maxFiles: 5 }),
  ],
});

if (process.env.NODE_ENV !== 'production' || process.env.CONSOLE_LOGS === 'true') {
  logger.add(
    new winston.transports.Console({
      format: combine(colorize(), timestamp({ format: 'HH:mm:ss' }), errors({ stack: true }), consoleFormat),
    })
  );
}

export default logger;
