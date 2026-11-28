/**
 * Common structure for all pickNorder Kafka events.
 *
 * @template TData - Represents the event-specific payload.
 * @template TEventType - Represents the event name (string literal).
 * @template TEventVersion - Represents the event schema version (number literal).
 *
 * @example
 * ```ts
 * type ProductOutOfStockEvent = EventEnvelope<
 *   InventoryStockData,
 *   typeof PRODUCT_OUT_OF_STOCK_EVENT_TYPE,
 *   1
 * >;
 * ```
 */
export interface EventEnvelope<
  TData,
  TEventType extends string = string,
  TEventVersion extends number = number,
> {
  // Unique event identifier used for idempotent processing.
  eventId: string;

  // Business event name.
  eventType: TEventType;

  // Schema version of this event.
  eventVersion: TEventVersion;

  // Timestamp when the business event occurred (ISO 8601).
  occurredAt: string;

  // Service that produced the event.
  producer: string;

  // Event-specific payload.
  data: TData;
}

/**
 * Standard Kafka message key.
 *
 * aggregateId identifies the entity associated with the event.
 */
export interface KafkaEventKey {
  aggregateId: string;
}
