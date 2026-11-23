import { AppError } from './app-error.js';
import { ErrorCodes } from './error-codes.js';

export class InsufficientStockError extends AppError {
  constructor(productId: string, requestedQuantity: number) {
    super({
      statusCode: 409,
      errorCode: ErrorCodes.INSUFFICIENT_STOCK,
      message: 'Insufficient stock available',
      details: {
        productId,
        requestedQuantity,
      },
    });
  }
}
