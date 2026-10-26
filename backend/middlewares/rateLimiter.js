import rateLimit from 'express-rate-limit';

// Global API rate limiter
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // 300 requests per window per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    code: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many requests from this IP address. Please try again after 15 minutes.',
  },
});

// Strict authentication endpoint rate limiter (anti-brute force)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // 15 attempts per 15 mins per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    code: 'AUTH_RATE_LIMIT_EXCEEDED',
    message: 'Too many authentication attempts. Please wait 15 minutes before trying again.',
  },
});

// Sensitive operations limiter (payments, grade changes, password updates)
export const sensitiveLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // 30 mutation requests per 15 mins
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    code: 'MUTATION_RATE_LIMIT_EXCEEDED',
    message: 'High frequency of sensitive actions detected. Please slow down.',
  },
});
