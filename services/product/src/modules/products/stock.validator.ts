import { ValidationError } from '../../shared/errors/validation-error.js';

export type StockOperation = 'INCREASE' | 'DECREASE';
export interface StockAdjustmentInput {
  operation: StockOperation;
  quantity: number;
}

export function parseStockAdjustment(body: unknown): StockAdjustmentInput {
  if (!body || typeof body !== 'object') {
    throw new ValidationError('A JSON body is required.');
  }
  const input = body as Record<string, unknown>;
  if (input.operation !== 'INCREASE' && input.operation !== 'DECREASE') {
    throw new ValidationError('operation must be INCREASE or DECREASE.');
  }
  if (!Number.isInteger(input.quantity) || Number(input.quantity) <= 0) {
    throw new ValidationError('quantity must be a positive integer.');
  }
  return {
    operation: input.operation,
    quantity: Number(input.quantity),
  };
}
