import type { InventoryStockEvent } from '../../shared/types/events/inventory.stock.events.js';
import { logger } from '../../shared/utils/logger.js';
import { stockAdjuster } from './inventory.service.js';

export async function handleStock(event: InventoryStockEvent): Promise<void> {
  const { eventId, data, eventType } = event;
  const { productId, productName } = data;

  const context = { eventId, productId, productName, eventType };

  logger.info(context, `Handling ${eventType} event`);

  const result = await stockAdjuster({
    eventId,
    eventType,
    productId,
  });

  if (result === 'DUPLICATE') {
    logger.warn(context, 'Duplicate Kafka event detected; skipping processing');
    return;
  }

  logger.info(context, 'Product inventory updated successfully');
}
