import type { SuccessMeta, SuccessResponse } from './success-response.schema.js';

interface BuildSuccessResponseOptions<T> {
  data: T;
  meta?: SuccessMeta;
}

export const buildSuccessResponse = <T>({
  data,
  meta,
}: BuildSuccessResponseOptions<T>): SuccessResponse<T> => ({
  success: true,
  data,
  ...(meta && { meta }),
});
