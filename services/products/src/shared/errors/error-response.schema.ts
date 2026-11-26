import { z } from 'zod';

export const ValidationDetailSchema = z.object({
  field: z.string(),
  code: z.string(),
  message: z.string(),
});

export const ErrorDetailsSchema = z.union([
  z.array(ValidationDetailSchema),
  z.record(z.string(), z.unknown()),
]);

export const ErrorBodySchema = z.object({
  code: z.string(),
  message: z.string(),
  requestId: z.string(),
  details: ErrorDetailsSchema.optional(),
});

export const ErrorResponseSchema = z.object({
  success: z.literal(false),
  error: ErrorBodySchema,
});

export type ValidationDetail = z.infer<typeof ValidationDetailSchema>;

export type ErrorDetails = z.infer<typeof ErrorDetailsSchema>;

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
