import type { Scalars } from '@prisma/orm-postgres/components';
import { z } from 'zod';
import type { Models } from '../../prisma/contract.js';

export const CategorySlugSchema = z.object({
  slug: z
    .string()
    .trim()
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      'Slug must contain lowercase letters, numbers, and single hyphens.',
    )
    .max(100),
});

export type CategorySlugInput = z.infer<typeof CategorySlugSchema>;

export const CategoryResponseSchema = z.object({
  productCount: z.number().int().nonnegative(),
});

export type CategoryDetail = Scalars<Models.public_Category>;

export type CategoryResponse = Omit<CategoryDetail, 'isActive' | 'updatedAt' | 'createdAt'> &
  z.infer<typeof CategoryResponseSchema>;
