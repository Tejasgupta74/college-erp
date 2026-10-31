import logger from '../config/logger.js';

export const notFound = (req, res, next) => {
  const error = new Error(`Resource Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

export const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode === 200 ? (err.status || err.statusCode || 500) : res.statusCode;
  let code = err.code || 'INTERNAL_SERVER_ERROR';
  let message = err.message || 'An unexpected server error occurred';
  let details = err.details || null;

  // Handle Payload Too Large (Express body-parser limit exceeded)
  if (err.type === 'entity.too.large' || err.status === 413 || err.statusCode === 413) {
    statusCode = 413;
    code = 'PAYLOAD_TOO_LARGE';
    message = 'Request entity too large: payload exceeds maximum allowed size (10MB)';
  } else if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    statusCode = 400;
    code = 'BAD_REQUEST';
    message = 'Malformed JSON body';
  }

  // Handle Mongoose Bad Identifier (CastError)
  if (err.name === 'CastError') {
    statusCode = 404;
    code = 'RESOURCE_NOT_FOUND';
    message = 'Requested resource identifier does not exist';
  }

  // Handle Mongoose duplicate key
  if (err.code === 11000) {
    statusCode = 400;
    code = 'DUPLICATE_KEY_ERROR';
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `Duplicate value for unique index: ${field}`;
  }

  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    statusCode = 400;
    code = 'VALIDATION_FAILED';
    message = Object.values(err.errors)
      .map((val) => val.message)
      .join(', ');
  }

  // Log error via Winston
  logger.error(`[Error Handler] ${statusCode} - ${message}`, {
    requestId: req.id,
    url: req.originalUrl,
    method: req.method,
    stack: err.stack,
    code,
  });

  // Sanitize 500 responses in production to prevent leaking system internals
  const sanitizedMessage =
    statusCode >= 500 && process.env.NODE_ENV === 'production'
      ? 'An unexpected server error occurred. Please contact institutional support.'
      : message;

  const sanitizedDetails =
    statusCode >= 500 && process.env.NODE_ENV === 'production' ? null : details;

  res.status(statusCode).json({
    success: false,
    code,
    message: sanitizedMessage,
    details: sanitizedDetails,
    requestId: req.id,
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
