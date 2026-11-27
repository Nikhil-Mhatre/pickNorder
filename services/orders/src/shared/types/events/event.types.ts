/**
 * Common structure for all pickNorder Kafka events.
 *
 * The generic type TData represents the event-specific payload.
 */
export interface EventEnvelope<TData> {
  // Unique event identifier.
  // Used to prevent processing the same event more than once.
  eventId: string;

  // Business event name.
  eventType: string;

  // Schema version of this event.
  eventVersion: number;

  // Timestamp when the business event occurred (ISO 8601).
  occurredAt: string;

  // Service that produced the event.
  producer: string;

  // Event-specific data.
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
