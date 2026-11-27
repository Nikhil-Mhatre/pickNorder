import type { ErrorRequestHandler } from 'express';

import { mapError } from '../errors/error-mapper.js';
import { buildErrorResponse } from '../errors/error-response.js';
import { ErrorResponseSchema } from '../errors/error-response.schema.js';
import { ErrorCodes } from '../errors/error-codes.js';
import { logger } from '../utils/logger.js';

export const errorHandler: ErrorRequestHandler = (originalError, req, res, next) => {
  if (res.headersSent) {
    next(originalError);
    return;
  }

  const error = mapError(originalError);
  const requestId = req.requestId ?? 'unknown';

  // Log the original error, not just the normalized one.
  logger.error(
    {
      requestId,
      method: req.method,
      path: req.originalUrl,
      statusCode: error.statusCode,
      errorCode: error.code,
      err: originalError,
    },
    'Request failed',
  );

  const response = buildErrorResponse({
    error,
    requestId,
  });

  const validatedResponse = ErrorResponseSchema.safeParse(response);

  if (!validatedResponse.success) {
    logger.error(
      {
        requestId,
        err: validatedResponse.error,
      },
      'Error response schema validation failed',
    );

    res.status(500).json({
      success: false,
      error: {
        code: ErrorCodes.INTERNAL_SERVER_ERROR,
        message: 'An unexpected error occurred.',
        requestId,
      },
    });

    return;
  }

  res.status(error.statusCode).json(validatedResponse.data);
};
