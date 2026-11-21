export interface AppErrorOptions {
  statusCode: number;
  errorCode: string;
  message: string;
  details?: unknown;
  isOperational?: boolean;
  cause?: unknown;
}

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly errorCode: string;
  public readonly details?: unknown;
  public readonly isOperational: boolean;

  constructor(options: AppErrorOptions) {
    super(options.message, { cause: options.cause });

    this.name = new.target.name;

    this.statusCode = options.statusCode;
    this.errorCode = options.errorCode;
    this.details = options.details;
    this.isOperational = options.isOperational ?? true;

    Error.captureStackTrace?.(this, new.target);
  }
}
