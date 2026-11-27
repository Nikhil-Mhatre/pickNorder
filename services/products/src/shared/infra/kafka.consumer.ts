// src/shared/infrastructure/kafka/kafka.consumer.ts

import { kafka } from '../config/kafka.config.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import {
  ORDER_CONFIRMED_CONSUMER_GROUP,
  ORDER_CONFIRMED_TOPIC,
} from '../types/events/order-confirmed.event.js';
import { handleOrderConfirmed } from '../../modules/inventory/order-confirmed.handler.js';

// The test topic we created in Aiven.
const TEST_TOPIC = 'picknorder.order.confirmed.v1';

const consumer = kafka.consumer({
  groupId: ORDER_CONFIRMED_CONSUMER_GROUP,
});

let isConsumerConnected = false;

/**
 * Connects the consumer and starts listening to our test topic.
 */
export async function startKafkaConsumer(): Promise<void> {
  // Don't try to connect when Kafka is disabled.
  if (!env.KAFKA_ENABLED) {
    logger.info('Kafka is disabled. Skipping consumer startup.');
    return;
  }

  // Prevent accidentally connecting the same consumer twice.
  if (isConsumerConnected) {
    logger.info('Kafka consumer is already connected.');
    return;
  }

  try {
    logger.info({ topic: TEST_TOPIC }, 'Connecting Kafka consumer...');

    // Establish the connection to Kafka.
    await consumer.connect();
    isConsumerConnected = true;

    // Subscribe to the topic.
    // fromBeginning: true lets this test group read existing messages.
    await consumer.subscribe({
      topic: ORDER_CONFIRMED_TOPIC,
      fromBeginning: false,
    });

    // Start processing messages.
    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        // Kafka message values are Buffers, so convert them to strings.
        const messageValue = message.value?.toString();

        if (!messageValue) {
          logger.warn(
            { topic, partition, offset: message.offset },
            'Received an empty Kafka message',
          );
          return;
        }

        try {
          // Our producer sends JSON, so parse the message.
          const event = JSON.parse(messageValue);

          logger.info(
            {
              topic,
              partition,
              offset: message.offset,
              key: message.key?.toString(),
              event,
            },
            'Kafka message received',
          );

          await handleOrderConfirmed(event);
        } catch (error) {
          // Log invalid JSON instead of crashing the consumer.
          logger.error(
            {
              err: error,
              topic,
              partition,
              offset: message.offset,
              message: messageValue,
            },
            'Failed to parse Kafka message',
          );
        }
      },
    });

    logger.info({ topic: TEST_TOPIC }, 'Kafka consumer is listening');
  } catch (error) {
    logger.error({ err: error }, 'Kafka consumer startup failed');

    // Clean up if connection succeeded but subscription/startup failed.
    if (isConsumerConnected) {
      try {
        await consumer.disconnect();
        isConsumerConnected = false;
      } catch (disconnectError) {
        logger.error({ err: disconnectError }, 'Failed to clean up Kafka consumer');
      }
    }

    throw error;
  }
}

/**
 * Disconnects the consumer during application shutdown.
 */
export async function stopKafkaConsumer(): Promise<void> {
  if (!env.KAFKA_ENABLED || !isConsumerConnected) {
    return;
  }

  try {
    logger.info('Disconnecting Kafka consumer...');

    await consumer.disconnect();
    isConsumerConnected = false;

    logger.info('Kafka consumer disconnected');
  } catch (error) {
    logger.error({ err: error }, 'Kafka consumer disconnect failed');
    throw error;
  }
}
