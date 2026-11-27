import type { OrderConfirmedEvent } from '../../shared/types/events/order-confirmed.event.js';
import { deductOrderStock } from './inventory.service.js';
import { logger } from '../../shared/utils/logger.js';

export async function handleOrderConfirmed(event: OrderConfirmedEvent): Promise<void> {
  const { eventId, data } = event;
  const { orderId, items } = data;

  const context = {
    eventId,
    orderId,
    itemCount: items.length,
  };

  logger.info(context, 'Handling order confirmed event');

  await deductOrderStock({
    eventId,
    orderId,
    items,
  });

  logger.info(context, 'Order inventory updated successfully');
}
