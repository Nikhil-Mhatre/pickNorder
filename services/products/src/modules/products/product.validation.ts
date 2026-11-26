import type { RequestHandler } from 'express';
import { AppError } from '../../shared/errors/app-error.js';
import { ErrorCodes } from '../../shared/errors/error-codes.js';
import { GetProductByIdSchema } from './product.types.js';

export const validateProductId: RequestHandler = (req, res, next) => {
  const result = GetProductByIdSchema.safeParse(req.params);

  if (!result.success) {
    next(
      new AppError({
        statusCode: 400,
        code: ErrorCodes.VALIDATION_ERROR,
        message: 'Invalid product ID.',
        cause: result.error,
      }),
    );
    return;
  }

  res.locals.productId = result.data.id;
  next();
};
