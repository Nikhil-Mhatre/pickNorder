import { z } from 'zod';

export const productListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),

  category: z.string().trim().optional(),
  search: z.string().trim().optional(),

  sortBy: z.enum(['name', 'price', 'createdAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const productIdSchema = z.object({
  id: z.string().trim().min(1, 'Product ID is required'),
});

export const stockAdjustmentSchema = z.object({
  operation: z.enum(['INCREASE', 'DECREASE']),
  quantity: z.number().int().positive(),
});

export type ProductListQuery = z.infer<typeof productListQuerySchema>;
export type StockAdjustmentInput = z.infer<typeof stockAdjustmentSchema>;
