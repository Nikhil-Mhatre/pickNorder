import type { ErrorCode } from './error-codes.js';
import type { ErrorDetails } from './error-response.schema.js';

export interface AppErrorOptions {
  statusCode: number;
  code: ErrorCode;
  message: string;
  details?: ErrorDetails;
  cause?: unknown;
}

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: ErrorCode;
  public readonly details?: ErrorDetails;
  public readonly isOperational = true;

  constructor(options: AppErrorOptions) {
    super(options.message, { cause: options.cause });

    this.name = 'AppError';
    this.statusCode = options.statusCode;
    this.code = options.code;
    this.details = options.details;

    Error.captureStackTrace?.(this, AppError);
  }
}
