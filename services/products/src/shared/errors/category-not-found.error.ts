import { AppError } from './app-error.js';
import { ErrorCodes } from './error-codes.js';

export class CategoryNotFoundError extends AppError {
  constructor(categoryId: string) {
    super({
      statusCode: 404,
      errorCode: ErrorCodes.CATEGORY_NOT_FOUND,
      message: 'Category not found',
      details: { categoryId },
    });
  }
}
