import type { RequestHandler } from 'express';
import { AppError } from '../../shared/errors/app-error.js';
import { ErrorCodes } from '../../shared/errors/error-codes.js';
import { GetProductByIdSchema, ListProductsSchema, UpdateStockSchema } from './product.types.js';

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

export const validateStockUpdate: RequestHandler = (req, res, next) => {
  const productIdResult = GetProductByIdSchema.safeParse(req.params);

  if (!productIdResult.success) {
    next(
      new AppError({
        statusCode: 400,
        code: ErrorCodes.VALIDATION_ERROR,
        message: 'Invalid product ID.',
        cause: productIdResult.error,
      }),
    );
    return;
  }

  const bodyResult = UpdateStockSchema.safeParse(req.body);

  if (!bodyResult.success) {
    next(
      new AppError({
        statusCode: 400,
        code: ErrorCodes.VALIDATION_ERROR,
        message: 'Invalid stock adjustment request.',
        details: bodyResult.error.issues.map((issue) => ({
          field: issue.path.join('.'),
          code: issue.code,
          message: issue.message,
        })),
        cause: bodyResult.error,
      }),
    );
    return;
  }

  res.locals.productId = productIdResult.data.id;
  req.body = bodyResult.data;

  next();
};

export const validateListProducts: RequestHandler = (req, res, next) => {
  const result = ListProductsSchema.safeParse(req.query);

  if (!result.success) {
    next(
      new AppError({
        statusCode: 400,
        code: ErrorCodes.VALIDATION_ERROR,
        message: 'Invalid product listing parameters.',
        details: result.error.issues.map((issue) => ({
          field: issue.path.join('.'),
          code: issue.code,
          message: issue.message,
        })),
        cause: result.error,
      }),
    );

    return;
  }

  res.locals.query = result.data;

  next();
};
