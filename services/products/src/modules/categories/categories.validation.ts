import type { RequestHandler } from 'express';
import { CategorySlugSchema } from './categories.types.js';
import { AppError } from '../../shared/errors/app-error.js';
import { ErrorCodes } from '../../shared/errors/error-codes.js';

export const validateCategorySlug: RequestHandler = (req, res, next) => {
  const result = CategorySlugSchema.safeParse(req.params);

  if (!result.success) {
    next(
      new AppError({
        statusCode: 400,
        code: ErrorCodes.VALIDATION_ERROR,
        message: 'Invalid category slug.',
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

  res.locals.slug = result.data.slug;

  next();
};
