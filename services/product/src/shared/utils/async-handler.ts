import type { RequestHandler } from 'express';

type AsyncController = (...args: Parameters<RequestHandler>) => Promise<unknown>;

export const asyncHandler =
  (fn: AsyncController): RequestHandler =>
  (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
