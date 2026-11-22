import { AppError } from './app-error.js';
import { ErrorCodes } from './error-codes.js';

export class ValidationError extends AppError {
  constructor(message: string) {
    super({
      statusCode: 400,
      errorCode: ErrorCodes.VALIDATION_ERROR,
      message: 'VALIDATION_ERROR',
      details: { message },
    });
  }
}
