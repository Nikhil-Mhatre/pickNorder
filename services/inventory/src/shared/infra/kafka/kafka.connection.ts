import { env } from '../../config/env.js';
import { kafka } from '../../config/kafka.config.js';
import { logger } from '../../utils/logger.js';
import { AppError } from '../../errors/app-error.js';
import { ErrorCodes } from '../../errors/error-codes.js';

const kafkaAdmin = kafka.admin();

let isAdminConnected = false;

/**
 * Connects to Kafka and verifies that the broker is reachable.
 *
 * When Kafka is enabled, a connection failure is treated as a startup
 * failure. We do not allow the service to start without Kafka.
 */
export async function connectKafka(): Promise<void> {
  if (!env.KAFKA_ENABLED) {
    logger.info('Kafka is disabled. Skipping connection.');
    return;
  }

  if (isAdminConnected) {
    logger.info('Kafka is already connected.');
    return;
  }

  logger.info('Connecting to Kafka...');

  try {
    await kafkaAdmin.connect();
    isAdminConnected = true;

    // Verify that Kafka is responding to requests.
    await kafkaAdmin.describeCluster();

    logger.info('Kafka connection established');
  } catch (error) {
    logger.error({ err: error }, 'Kafka connection failed');

    // If the connection was established but verification failed,
    // attempt to clean it up before throwing the error.
    if (isAdminConnected) {
      try {
        await kafkaAdmin.disconnect();
        isAdminConnected = false;
      } catch (disconnectError) {
        logger.error({ err: disconnectError }, 'Kafka cleanup after connection failure failed');
      }
    }

    throw new AppError({
      statusCode: 500,
      code: ErrorCodes.KAFKA_CONNECTION_ERROR,
      message: 'Failed to connect to Kafka',
      cause: error,
    });
  }
}

/**
 * Disconnects the Kafka Admin client during application shutdown.
 */
export async function disconnectKafka(): Promise<void> {
  if (!env.KAFKA_ENABLED || !isAdminConnected) {
    return;
  }

  logger.info('Disconnecting from Kafka...');

  try {
    await kafkaAdmin.disconnect();
    isAdminConnected = false;

    logger.info('Kafka connection closed');
  } catch (error) {
    logger.error({ err: error }, 'Kafka disconnect failed');

    throw new AppError({
      statusCode: 500,
      code: ErrorCodes.KAFKA_DISCONNECTION_ERROR,
      message: 'Failed to disconnect from Kafka',
      cause: error,
    });
  }
}
