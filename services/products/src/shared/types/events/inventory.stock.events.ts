import type { EventEnvelope, KafkaEventKey } from './event.types.js';

export const INVENTORY_STOCK_TOPIC = 'picknorder.inventory.stock.v1';
export const INVENTORY_STOCK_CONSUMER_GROUP = 'picknorder';

export const PRODUCT_OUT_OF_STOCK_EVENT_TYPE = 'product.out-of-stock';
export const PRODUCT_RESTOCKED_EVENT_TYPE = 'product.restocked';

export const INVENTORY_STOCK_PRODUCER = 'inventory-service';

/**
 * Payload shared by inventory stock events.
 */
export interface InventoryStockData {
  productId: string;
  productName: string;
}

/**
 * Product became unavailable because its stock reached zero.
 */
export type ProductOutOfStockEvent = EventEnvelope<
  InventoryStockData,
  typeof PRODUCT_OUT_OF_STOCK_EVENT_TYPE,
  1
>;

/**
 * Product became available again after being restocked.
 */
export type ProductRestockedEvent = EventEnvelope<
  InventoryStockData,
  typeof PRODUCT_RESTOCKED_EVENT_TYPE,
  1
>;

/**
 * Union of supported inventory stock events.
 *
 * eventType allows TypeScript to identify which event we are handling.
 */
export type InventoryStockEvent = ProductOutOfStockEvent | ProductRestockedEvent;

/**
 * Kafka message key for inventory stock events.
 */
export type InventoryStockMessageKey = KafkaEventKey;
