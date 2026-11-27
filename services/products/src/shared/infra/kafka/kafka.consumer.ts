// src/shared/infrastructure/kafka/kafka.consumer.ts

import { kafka } from '../../config/kafka.config.js';
import { env } from '../../config/env.js';
import { logger } from '../../utils/logger.js';
import {
  ORDER_CONFIRMED_CONSUMER_GROUP,
  ORDER_CONFIRMED_TOPIC,
} from '../../types/events/order-confirmed.event.js';
import { handleOrderConfirmed } from '../../../modules/inventory/order-confirmed.handler.js';

const consumer = kafka.consumer({
  groupId: ORDER_CONFIRMED_CONSUMER_GROUP,
});

let isConnected = false;

/**
 * Processes a single Kafka message.
 */
async function processMessage({
  topic,
  partition,
  message,
}: {
  topic: string;
  partition: number;
  message: {
    offset: string;
    key: Buffer | null;
    value: Buffer | null;
  };
}): Promise<void> {
  const messageContext = {
    topic,
    partition,
    offset: message.offset,
    key: message.key?.toString(),
  };

  // A Kafka message must contain a value.
  if (!message.value) {
    throw new Error('Kafka message value is empty');
  }

  const messageValue = message.value.toString();

  // Parse the JSON separately so parsing errors are not confused
  // with inventory processing errors.
  let event;

  try {
    event = JSON.parse(messageValue);
  } catch (error) {
    logger.error(
      {
        err: error,
        ...messageContext,
      },
      'Invalid JSON in Kafka message',
    );

    throw error;
  }

  logger.info(messageContext, 'Processing Kafka message');

  // Process the event.
  // If this fails, propagate the error so KafkaJS can handle
  // the failed message instead of treating it as successful.
  try {
    await handleOrderConfirmed(event);

    logger.info(messageContext, 'Kafka message processed successfully');
  } catch (error) {
    logger.error(
      {
        err: error,
        ...messageContext,
      },
      'Failed to process Kafka message',
    );

    throw error;
  }
}

/**
 * Connects the consumer, subscribes to the order-confirmed topic,
 * and starts processing messages.
 */
export async function startKafkaConsumer(): Promise<void> {
  if (!env.KAFKA_ENABLED) {
    logger.info('Kafka is disabled. Consumer startup skipped.');
    return;
  }

  if (isConnected) {
    logger.info('Kafka consumer is already connected.');
    return;
  }

  try {
    logger.info(
      {
        topic: ORDER_CONFIRMED_TOPIC,
        groupId: ORDER_CONFIRMED_CONSUMER_GROUP,
      },
      'Starting Kafka consumer',
    );

    await consumer.connect();
    isConnected = true;

    await consumer.subscribe({
      topic: ORDER_CONFIRMED_TOPIC,
      fromBeginning: false,
    });

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        await processMessage({
          topic,
          partition,
          message,
        });
      },
    });

    logger.info({ topic: ORDER_CONFIRMED_TOPIC }, 'Kafka consumer started successfully');
  } catch (error) {
    logger.error({ err: error }, 'Kafka consumer startup failed');

    await cleanupConsumer();

    throw error;
  }
}

/**
 * Disconnects the consumer safely.
 */
export async function stopKafkaConsumer(): Promise<void> {
  if (!env.KAFKA_ENABLED || !isConnected) {
    return;
  }

  logger.info('Stopping Kafka consumer');

  await cleanupConsumer();

  logger.info('Kafka consumer stopped');
}

/**
 * Disconnects the consumer and resets its connection state.
 */
async function cleanupConsumer(): Promise<void> {
  if (!isConnected) {
    return;
  }

  try {
    await consumer.disconnect();
  } finally {
    isConnected = false;
  }
}
