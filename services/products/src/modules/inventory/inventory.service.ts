import { db } from '../../prisma/db.js';

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
  await db.transaction(async (tx) => {
    // 1. Record the event first.
    // The unique eventId prevents the same event from
    // deducting stock more than once.
    await tx.orm.public.ProcessedEvent.create({
      eventId: input.eventId,
      eventType: 'order.confirmed',
    });

    // 2. Deduct stock for each product.
    for (const item of input.items) {
      const updateQuery = tx.sql.public.Product.update((product, fns) => ({
        stock: fns.raw`${product.stock} - ${item.quantity}`.returns('pg/int4@1'),
      }))
        .where((product, fns) =>
          fns.and(fns.eq(product.id, item.productId), fns.gte(product.stock, item.quantity)),
        )
        .returning('id')
        .build();

      const updatedProducts = await tx.query(updateQuery);

      // No product was updated:
      // product doesn't exist or stock is insufficient.
      if (updatedProducts.length === 0) {
        throw new Error(`Insufficient stock or product not found: ${item.productId}`);
      }
    }
  });
}
