import { app } from './app.js';
import { env } from './shared/config/env.js';

import type { Server } from 'node:http';
import { logger } from './shared/utils/logger.js';
import { db } from './prisma/db.js';
import { connectKafka, disconnectKafka } from './shared/infra/kafka/kafka.connection.js';
import { startKafkaConsumer, stopKafkaConsumer } from './shared/infra/kafka/kafka.consumer.js';

let server: Server | undefined;
let shuttingDown = false;

async function startServer(): Promise<void> {
  // Connect to PostgreSQL first.
  await db.connect();
  logger.info('Connected to PostgreSQL');

  // Connect to Kafka before starting HTTP.
  // If Kafka is enabled but unavailable, startup will fail.
  await connectKafka();

  // Start the Kafka consumer after Kafka connection is established.
  await startKafkaConsumer();

  // Start HTTP only after required dependencies are ready.
  await new Promise<void>((resolve, reject) => {
    const httpServer = app.listen(env.PORT);

    httpServer.once('listening', () => {
      server = httpServer;
      logger.info({ port: env.PORT }, 'Product Service started');
      resolve();
    });

    httpServer.once('error', (error) => {
      reject(error);
    });
  });
}

async function shutdown(signal: string): Promise<void> {
  if (shuttingDown) return;
  shuttingDown = true;

  logger.info({ signal }, 'Graceful shutdown started');

  const forceExitTimer = setTimeout(() => {
    logger.error('Graceful shutdown timed out; forcing exit');
    process.exit(1);
  }, 10_000);

  forceExitTimer.unref();

  try {
    // Stop accepting new HTTP requests first.
    if (server?.listening) {
      await new Promise<void>((resolve, reject) => {
        server!.close((error) => {
          if (error) reject(error);
          else resolve();
        });
      });
    }
  } catch (error) {
    logger.error({ err: error }, 'HTTP server shutdown failed');
    process.exitCode = 1;
  }

  // Stop the consumer before disconnecting Kafka.
  try {
    await stopKafkaConsumer();
  } catch (error) {
    logger.error({ err: error }, 'Kafka consumer shutdown failed');
    process.exitCode = 1;
  }

  // Attempt to close Kafka even if HTTP shutdown failed.
  try {
    await disconnectKafka();
  } catch (error) {
    logger.error({ err: error }, 'Kafka shutdown failed');
    process.exitCode = 1;
  }

  // Attempt to close PostgreSQL even if Kafka shutdown failed.
  try {
    await db.close();
  } catch (error) {
    logger.error({ err: error }, 'Database shutdown failed');
    process.exitCode = 1;
  }

  logger.info('Product Service stopped');

  clearTimeout(forceExitTimer);
}

process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));

process.on('unhandledRejection', (reason) => {
  logger.fatal({ err: reason }, 'Unhandled promise rejection');
  process.exitCode = 1;
  void shutdown('unhandledRejection');
});

startServer().catch(async (error) => {
  logger.fatal({ err: error }, 'Product Service startup failed');

  process.exitCode = 1;

  // Clean up the consumer if it started before startup failed.
  try {
    await stopKafkaConsumer();
  } catch (cleanupError) {
    logger.error({ err: cleanupError }, 'Kafka consumer startup cleanup failed');
  }

  // Clean up resources that may have connected before startup failed.
  try {
    await disconnectKafka();
  } catch (cleanupError) {
    logger.error({ err: cleanupError }, 'Kafka startup cleanup failed');
  }

  try {
    await db.close();
  } catch (cleanupError) {
    logger.error({ err: cleanupError }, 'Database startup cleanup failed');
  }
});
