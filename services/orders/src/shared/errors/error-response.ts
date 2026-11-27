import type { ErrorResponse } from './error-response.schema.js';
import type { AppError } from './app-error.js';

interface BuildErrorResponseOptions {
  error: AppError;
  requestId: string;
}

export const buildErrorResponse = ({
  error,
  requestId,
}: BuildErrorResponseOptions): ErrorResponse => ({
  success: false,
  error: {
    code: error.code,
    message: error.message,
    requestId,
    ...(error.details != null && {
      details: error.details,
    }),
  },
});
