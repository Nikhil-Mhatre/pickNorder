import type { RequestHandler } from 'express';

import { AppError } from '../errors/app-error.js';
import { ErrorCodes } from '../errors/error-codes.js';

export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(
    new AppError({
      statusCode: 404,
      code: ErrorCodes.ROUTE_NOT_FOUND,
      message: 'The requested route was not found.',
      details: {
        method: req.method,
        path: req.path,
      },
    }),
  );
};
