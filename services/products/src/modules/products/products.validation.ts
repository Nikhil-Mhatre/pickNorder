import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

const priceSchema = z
  .string()
  .trim()
  .regex(/^\d+(\.\d{1,2})?$/, 'Must be a valid price with up to 2 decimal places')
  .refine((value) => Number(value) >= 0, 'Price must be non-negative');

export const getProductsQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),

    limit: z.coerce.number().int().min(1).max(100).default(20),

    search: z
      .string()
      .trim()
      .max(100)
      .optional()
      .transform((value) => (value === '' ? undefined : value)),

    category: z
      .string()
      .trim()
      .min(1)
      .max(100)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      .optional(),

    minPrice: priceSchema.optional(),

    maxPrice: priceSchema.optional(),

    inStock: z
      .enum(['true', 'false'])
      .optional()
      .transform((value) => {
        if (value === undefined) return undefined;
        return value === 'true';
      }),

    sortBy: z.enum(['createdAt', 'name', 'price', 'stock']).default('createdAt'),

    sortOrder: z.enum(['asc', 'desc']).default('desc'),
  })
  .strict()
  .refine(
    (query) =>
      query.minPrice === undefined ||
      query.maxPrice === undefined ||
      Number(query.minPrice) <= Number(query.maxPrice),
    {
      message: 'minPrice cannot be greater than maxPrice',
      path: ['minPrice'],
    },
  );

export type GetProductsValidatedQuery = z.output<typeof getProductsQuerySchema>;

export const validateGetProductsQuery = (req: Request, res: Response, next: NextFunction): void => {
  const result = getProductsQuerySchema.safeParse(req.query);

  if (!result.success) {
    res.status(400).json({
      success: false,
      message: 'Invalid query parameters',
      errors: result.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      })),
    });
    return;
  }

  res.locals.productsQuery = result.data;

  next();
};
