import { ZodError } from 'zod';

import { AppError } from './app-error.js';
import { ErrorCodes } from './error-codes.js';

export const mapError = (error: unknown): AppError => {
  // Already normalized
  if (error instanceof AppError) {
    return error;
  }

  // Zod validation errors
  if (error instanceof ZodError) {
    const details = error.issues.map((issue) => ({
      field: issue.path.join('.'),
      code: issue.code,
      message: issue.message,
    }));

    return new AppError({
      statusCode: 400,
      code: ErrorCodes.VALIDATION_ERROR,
      message: 'Request validation failed.',
      details,
      cause: error,
    });
  }

  // Unexpected error
  return new AppError({
    statusCode: 500,
    code: ErrorCodes.INTERNAL_SERVER_ERROR,
    message: 'An unexpected error occurred.',
    cause: error,
  });
};
