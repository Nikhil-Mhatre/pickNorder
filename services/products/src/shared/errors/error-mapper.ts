import { AppError } from './app-error.js';
import { ErrorCodes } from './error-codes.js';

const getErrorCode = (error: unknown): string | undefined => {
  if (typeof error !== 'object' || error === null || !('code' in error)) {
    return undefined;
  }

  const code = error.code;
  return typeof code === 'string' ? code : undefined;
};

const getErrorType = (error: unknown): string | undefined => {
  if (typeof error !== 'object' || error === null || !('type' in error)) {
    return undefined;
  }

  const type = error.type;
  return typeof type === 'string' ? type : undefined;
};

export const mapError = (error: unknown): AppError => {
  // Already handled application error
  if (error instanceof AppError) {
    return error;
  }

  // Express JSON parser errors
  const errorType = getErrorType(error);

  if (errorType === 'entity.parse.failed') {
    return new AppError({
      statusCode: 400,
      errorCode: ErrorCodes.INVALID_REQUEST,
      message: 'Invalid JSON request body',
      cause: error,
    });
  }

  if (errorType === 'entity.too.large') {
    return new AppError({
      statusCode: 413,
      errorCode: ErrorCodes.INVALID_REQUEST,
      message: 'Request body is too large',
      cause: error,
    });
  }

  // Prisma errors
  const prismaCode = getErrorCode(error);

  switch (prismaCode) {
    case 'P2000':
      return new AppError({
        statusCode: 400,
        errorCode: ErrorCodes.VALIDATION_ERROR,
        message: 'Invalid request data',
        cause: error,
      });

    case 'P2002':
      return new AppError({
        statusCode: 409,
        errorCode: ErrorCodes.DATABASE_CONSTRAINT_ERROR,
        message: 'A resource with the provided value already exists',
        cause: error,
      });

    case 'P2003':
      return new AppError({
        statusCode: 409,
        errorCode: ErrorCodes.DATABASE_CONSTRAINT_ERROR,
        message: 'Request conflicts with an existing resource',
        cause: error,
      });

    case 'P2025':
      return new AppError({
        statusCode: 404,
        errorCode: ErrorCodes.RESOURCE_NOT_FOUND,
        message: 'Resource not found',
        cause: error,
      });

    // Database connection / infrastructure failures
    case 'P1000':
    case 'P1001':
    case 'P1002':
    case 'P1008':
    case 'P1017':
    case 'P2024':
      return new AppError({
        statusCode: 503,
        errorCode: ErrorCodes.SERVICE_UNAVAILABLE,
        message: 'Database service is temporarily unavailable',
        isOperational: false,
        cause: error,
      });

    default:
      break;
  }

  // Unknown error
  return new AppError({
    statusCode: 500,
    errorCode: ErrorCodes.INTERNAL_SERVER_ERROR,
    message: 'An unexpected error occurred',
    isOperational: false,
    cause: error,
  });
};
