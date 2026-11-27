import { z } from 'zod';

export const PaginationSchema = z.object({
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
  total: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
});

export const SuccessMetaSchema = z.object({
  pagination: PaginationSchema.optional(),
});

export const SuccessResponseSchema = <T extends z.ZodType>(dataSchema: T) =>
  z.object({
    success: z.literal(true),
    data: dataSchema,
    meta: SuccessMetaSchema.optional(),
  });

export type Pagination = z.infer<typeof PaginationSchema>;
export type SuccessMeta = z.infer<typeof SuccessMetaSchema>;

export type SuccessResponse<T> = {
  success: true;
  data: T;
  meta?: SuccessMeta;
};
