import { db } from '../../prisma/db.js';
import { AppError } from '../../shared/errors/app-error.js';

interface StockDeductionItem {
  productId: string;
  quantity: number;
}

interface DeductOrderStockInput {
  eventId: string;
  orderId: string;
  items: StockDeductionItem[];
}

export async function deductOrderStock(input: DeductOrderStockInput): Promise<void> {
  // Reject invalid input before opening a database transaction.
  if (!input.eventId || !input.orderId || input.items.length === 0) {
    throw new AppError({
      code: 'INVALID_STOCK_ADJUSTMENT',
      message: 'Invalid order stock deduction input',
      statusCode: 400,
    });
  }

  for (const item of input.items) {
    if (!item.productId || !Number.isInteger(item.quantity) || item.quantity <= 0) {
      throw new AppError({
        code: 'INVALID_STOCK_ADJUSTMENT',
        message: `Invalid stock deduction item: ${item.productId}`,
        statusCode: 400,
      });
    }
  }

  await db.transaction(async (tx) => {
    // Register the event so it cannot deduct stock twice.
    // A duplicate eventId will fail because it is unique.
    await tx.orm.public.ProcessedEvent.create({
      eventId: input.eventId,
      eventType: 'order.confirmed',
    });

    // Deduct stock for each item in the order.
    for (const item of input.items) {
      const query = tx.sql.public.inventory
        .update((product, fns) => ({
          stock: fns.raw`${product.stock} - ${item.quantity}`.returns('pg/int4@1'),
        }))
        .where((product, fns) =>
          fns.and(fns.eq(product.id, item.productId), fns.gte(product.stock, item.quantity)),
        )
        .returning('id')
        .build();

      const result = await tx.query(query);

      // No row updated means the product doesn't exist
      // or there isn't enough stock available.
      if (result.length === 0) {
        throw new AppError({
          code: 'INSUFFICIENT_STOCK',
          message: `Insufficient stock or product not found: ${item.productId}`,
          statusCode: 409,
        });
      }
    }
  });
}
