import { db } from '../../prisma/db.js';
import { AppError } from '../../shared/errors/app-error.js';
import {
  PRODUCT_OUT_OF_STOCK_EVENT_TYPE,
  PRODUCT_RESTOCKED_EVENT_TYPE,
} from '../../shared/types/events/inventory.stock.events.js';

type StockEventType = typeof PRODUCT_OUT_OF_STOCK_EVENT_TYPE | typeof PRODUCT_RESTOCKED_EVENT_TYPE;

interface StockAdjusterInput {
  eventId: string;
  productId: string;
  eventType: StockEventType;
}

type StockAdjustmentResult = 'PROCESSED' | 'DUPLICATE';

function isDuplicateEventError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  if (!('sqlState' in error) || !('constraint' in error)) {
    return false;
  }

  return error.sqlState === '23505' && error.constraint === 'ProcessedEvent_pkey';
}

export async function stockAdjuster(input: StockAdjusterInput): Promise<StockAdjustmentResult> {
  if (!input.eventId || !input.productId) {
    throw new AppError({
      code: 'INVALID_STOCK_ADJUSTMENT',
      message: 'Invalid stock adjustment input',
      statusCode: 400,
    });
  }

  const statusByEventType: Record<StockEventType, 'ACTIVE' | 'INACTIVE'> = {
    [PRODUCT_OUT_OF_STOCK_EVENT_TYPE]: 'INACTIVE',
    [PRODUCT_RESTOCKED_EVENT_TYPE]: 'ACTIVE',
  };

  const newStatus = statusByEventType[input.eventType];

  try {
    await db.transaction(async (tx) => {
      // Insert the event ID first.
      // The database primary key prevents the same event from being recorded twice.
      await tx.orm.public.ProcessedEvent.create({
        eventId: input.eventId,
        eventType: input.eventType,
      });

      // Only update the product if the event was successfully registered.
      await tx.orm.public.Product.where({ id: input.productId }).update({
        status: newStatus,
      });
    });

    return 'PROCESSED';
  } catch (error) {
    // Prisma unique constraint error (23505) means the event ID
    // already exists in ProcessedEvent.
    if (isDuplicateEventError(error)) {
      return 'DUPLICATE';
    }

    // All other errors are genuine failures and should propagate.
    throw error;
  }
}
