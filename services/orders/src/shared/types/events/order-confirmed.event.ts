import type { EventEnvelope } from './event.types.js';

/**
 * Kafka topic for order confirmation events.
 */
export const ORDER_CONFIRMED_TOPIC = 'picknorder.order.confirmed.v1';

/**
 * Consumer group used by Orders Service for order confirmation events.
 */
export const ORDER_CONFIRMED_CONSUMER_GROUP = 'picknorder-orders-service';

/**
 * Event type identifier.
 */
export const ORDER_CONFIRMED_EVENT_TYPE = 'order.confirmed';

/**
 * Producer service identifier.
 */
export const ORDER_CONFIRMED_PRODUCER = 'order-service';

/**
 * A orders and quantity included in a confirmed order.
 */
export interface OrderConfirmedItem {
  // Orders ID in Orders Service.
  productId: string;

  // Number of units ordered. Must be a positive integer.
  quantity: number;
}

/**
 * Payload carried by the order.confirmed event.
 */
export interface OrderConfirmedData {
  // Unique order ID.
  orderId: string;

  // Orders whose stock needs to be deducted.
  items: OrderConfirmedItem[];
}

/**
 * Event published by Order Service after an order is confirmed.
 *
 * Orders Service consumes this event to deduct stock.
 */
export type OrderConfirmedEvent = EventEnvelope<OrderConfirmedData> & {
  eventType: typeof ORDER_CONFIRMED_EVENT_TYPE;
  eventVersion: 1;
  producer: typeof ORDER_CONFIRMED_PRODUCER;
};

/**
 * Kafka key for an order.confirmed event.
 *
 * Using orderId as the message key keeps events for the same order
 * associated with the same Kafka partition.
 */
export interface OrderConfirmedMessageKey {
  orderId: string;
}
