import { kafka } from '../../config/kafka.config.js';
import { env } from '../../config/env.js';
import { logger } from '../../utils/logger.js';
import {
  INVENTORY_STOCK_TOPIC,
  INVENTORY_STOCK_CONSUMER_GROUP,
  INVENTORY_STOCK_PRODUCER,
  PRODUCT_OUT_OF_STOCK_EVENT_TYPE,
  PRODUCT_RESTOCKED_EVENT_TYPE,
  type InventoryStockEvent,
} from '../../types/events/inventory.stock.events.js';
import { handleStock } from '../../../modules/inventory/stock-handlers.js';

const consumer = kafka.consumer({
  groupId: INVENTORY_STOCK_CONSUMER_GROUP,
});

let isConnected = false;

function isInventoryStockEvent(event: any): event is InventoryStockEvent {
  return (
    event &&
    typeof event.eventId === 'string' &&
    (event.eventType === PRODUCT_OUT_OF_STOCK_EVENT_TYPE ||
      event.eventType === PRODUCT_RESTOCKED_EVENT_TYPE) &&
    event.eventVersion === 1 &&
    typeof event.occurredAt === 'string' &&
    event.producer === INVENTORY_STOCK_PRODUCER &&
    event.data &&
    typeof event.data.productId === 'string' &&
    typeof event.data.productName === 'string'
  );
}

async function processMessage(
  topic: string,
  partition: number,
  offset: string,
  messageValue: Buffer | null,
): Promise<void> {
  const context = { topic, partition, offset };

  // 1. Check if the message has a value.
  if (!messageValue) {
    logger.warn(context, 'Kafka message is empty; skipping');
    return;
  }

  // 2. Convert the message from JSON string to an object.
  let event: unknown;

  try {
    event = JSON.parse(messageValue.toString());
  } catch (error) {
    logger.warn({ err: error, ...context }, 'Invalid Kafka JSON; skipping');
    return;
  }

  // 3. Validate the event structure.
  if (!isInventoryStockEvent(event)) {
    logger.warn(context, 'Invalid inventory event; skipping');
    return;
  }

  // 4. Route the event to the appropriate handler.
  if (topic !== INVENTORY_STOCK_TOPIC) {
    logger.warn({ ...context, topic }, 'Unexpected Kafka topic; skipping');
    return;
  }

  switch (event.eventType) {
    case PRODUCT_OUT_OF_STOCK_EVENT_TYPE:
    case PRODUCT_RESTOCKED_EVENT_TYPE:
      logger.info(
        { ...context, eventId: event.eventId, eventType: event.eventType },
        'Processing inventory event',
      );

      await handleStock(event);

      logger.info(
        { ...context, eventId: event.eventId, eventType: event.eventType },
        'Inventory event processed',
      );
      break;
  }
}

export async function startKafkaConsumer(): Promise<void> {
  if (!env.KAFKA_ENABLED) {
    logger.info('Kafka is disabled; consumer startup skipped');
    return;
  }

  if (isConnected) {
    logger.info('Kafka consumer is already running');
    return;
  }

  try {
    logger.info('Starting Kafka consumer');

    await consumer.connect();
    isConnected = true;

    await consumer.subscribe({
      topic: INVENTORY_STOCK_TOPIC,
      fromBeginning: false,
    });

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        await processMessage(topic, partition, message.offset, message.value);
      },
    });

    logger.info('Kafka consumer started');
  } catch (error) {
    logger.error({ err: error }, 'Kafka consumer startup failed');

    await stopKafkaConsumer();
    throw error;
  }
}

export async function stopKafkaConsumer(): Promise<void> {
  if (!env.KAFKA_ENABLED || !isConnected) {
    return;
  }

  logger.info('Stopping Kafka consumer');

  try {
    await consumer.disconnect();
    logger.info('Kafka consumer stopped');
  } finally {
    isConnected = false;
  }
}
