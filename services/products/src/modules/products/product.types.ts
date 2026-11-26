import { Scalars } from '@prisma/orm-postgres/components';
import { z } from 'zod';
import { Models } from '../../prisma/contract.js';

export const GetProductByIdSchema = z.object({
  id: z.string().trim().min(1, 'Product ID is required').max(64, 'Invalid product ID'),
});

export type ProductDetail = Scalars<Models.public_Product>;
export type CategoryDetail = Scalars<Models.public_Category>;
export type GetProductByIdOutputSchema = Omit<ProductDetail, 'isActive' | 'categoryId'> & {
  category: Pick<CategoryDetail, 'id' | 'name' | 'slug'>;
};
export type GetProductByIdInputSchema = z.infer<typeof GetProductByIdSchema>;
