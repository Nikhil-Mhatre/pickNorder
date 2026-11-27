import { AppError } from './app-error.js';
import { ErrorCodes } from './error-codes.js';

export class ProductNotFoundError extends AppError {
  constructor(productId: string) {
    super({
      statusCode: 404,
      errorCode: ErrorCodes.PRODUCT_NOT_FOUND,
      message: 'Product not found',
      details: { productId },
    });
  }
}
