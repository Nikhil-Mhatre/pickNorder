import type { OrderConfirmedEvent } from '../../shared/types/events/order-confirmed.event.js';
import { deductOrderStock } from './inventory.service.js';
import { logger } from '../../shared/utils/logger.js';

export async function handleOrderConfirmed(event: OrderConfirmedEvent): Promise<void> {
  logger.info(
    { eventId: event.eventId, orderId: event.data.orderId },
    'Processing order confirmed event',
  );

  await deductOrderStock({
    eventId: event.eventId,
    orderId: event.data.orderId,
    items: event.data.items,
  });

  logger.info(
    { eventId: event.eventId, orderId: event.data.orderId },
    'Order stock deducted successfully',
  );
}
