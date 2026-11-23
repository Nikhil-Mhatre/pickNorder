import type { ErrorRequestHandler } from 'express';
import { mapError } from '../errors/error-mapper.js';
import { logger } from '../utils/logger.js';

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  const error = mapError(err);

  // Normalize request ID to string.
  // pino-http's ReqId type may be string | number.
  const traceId = String(req.id ?? 'unknown');

  const logPayload = {
    err,
    errorCode: error.errorCode,
    statusCode: error.statusCode,
    traceId,
    method: req.method,
    path: req.path,
    service: 'product-service',
    operational: error.isOperational,
  };

  // 5xx errors: error log
  if (error.statusCode >= 500) {
    logger.error(logPayload, 'Request failed with server error');
  }
  // 4xx errors: warning log
  else {
    logger.warn(logPayload, 'Request failed with client error');
  }

  // Prevent attempting to write a response after headers have been sent.
  if (res.headersSent) {
    return;
  }

  res.status(error.statusCode).json({
    success: false,
    error: {
      code: error.errorCode,
      message: error.message,
      traceId,
      ...(error.details !== undefined && {
        details: error.details,
      }),
    },
  });
};
