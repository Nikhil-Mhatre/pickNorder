import type { NextFunction, Request, Response } from 'express';

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function validateCategorySlug(req: Request, res: Response, next: NextFunction) {
  const { slug } = req.params;

  // Ensure slug is a string before applying regex validation.
  if (typeof slug !== 'string' || !SLUG_PATTERN.test(slug)) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid category slug',
      },
    });
  }

  next();
}
