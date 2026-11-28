import type { Scalars } from '@prisma/orm-postgres/components';
import { z } from 'zod';
import type { Models } from '../../prisma/contract.js';

export const GetProductByIdSchema = z.object({
  id: z.string().trim().min(1, 'Product ID is required').max(64, 'Invalid product ID'),
});
export const UpdateStockSchema = z.object({
  operation: z.enum(['INCREASE', 'DECREASE']),
  quantity: z.number().int().positive(),
});

export const ListProductsSchema = z.object({
  page: z.coerce.number().int().positive().default(1),

  limit: z.coerce.number().int().min(1).max(100).default(10),

  category: z.string().trim().min(1).optional(),

  search: z.string().trim().min(1).optional(),

  sortBy: z.enum(['name', 'price', 'createdAt']).default('createdAt'),

  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type ProductDetail = Scalars<Models.public_Product>;
export type CategoryDetail = Scalars<Models.public_Category>;
export type GetProductByIdOutputSchema = Omit<ProductDetail, 'status' | 'categoryId'> & {
  category: Pick<CategoryDetail, 'id' | 'name' | 'slug'>;
};
export type GetProductByIdInputSchema = z.infer<typeof GetProductByIdSchema>;
export type UpdateStockInput = z.infer<typeof UpdateStockSchema>;

export type ListProductsInput = z.infer<typeof ListProductsSchema>;
