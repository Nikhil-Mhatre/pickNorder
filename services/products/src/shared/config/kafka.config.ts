import fs from 'node:fs';
import path from 'node:path';
import { Kafka, logLevel } from 'kafkajs';
import { env } from './env.js';
import { AppError } from '../errors/app-error.js';
import { ErrorCodes } from '../errors/error-codes.js';
import { logger } from '../utils/logger.js';

/**
 * Parses and validates the configured Kafka brokers.
 *
 * Brokers are comma-separated in the environment variable.
 */
function getKafkaBrokers(): string[] {
  const brokers = env.KAFKA_BROKERS.split(',')
    .map((broker) => broker.trim())
    .filter(Boolean);

  if (brokers.length === 0) {
    throw new AppError({
      statusCode: 500,
      code: ErrorCodes.KAFKA_CONNECTION_ERROR,
      message: 'KAFKA_BROKERS must contain at least one broker',
    });
  }

  return brokers;
}

/**
 * Configures SASL authentication.
 *
 * Kafka credentials are validated by env.ts when Kafka is enabled.
 */
function getSaslConfig() {
  if (!env.KAFKA_ENABLED) {
    return undefined;
  }

  const { KAFKA_SASL_USERNAME, KAFKA_SASL_PASSWORD } = env;

  switch (env.KAFKA_SASL_MECHANISM) {
    case 'scram-sha-256':
      return {
        mechanism: 'scram-sha-256' as const,
        username: KAFKA_SASL_USERNAME!,
        password: KAFKA_SASL_PASSWORD!,
      };

    case 'scram-sha-512':
      return {
        mechanism: 'scram-sha-512' as const,
        username: KAFKA_SASL_USERNAME!,
        password: KAFKA_SASL_PASSWORD!,
      };

    default:
      throw new AppError({
        statusCode: 500,
        code: ErrorCodes.KAFKA_CONNECTION_ERROR,
        message: `Unsupported Kafka SASL mechanism: ${env.KAFKA_SASL_MECHANISM}`,
      });
  }
}

/**
 * Configures TLS using the CA certificate supplied by the environment.
 *
 * Kafka requires an explicit CA certificate in this project configuration
 * when enabled. We do not disable certificate validation.
 */
function getKafkaSslConfig() {
  if (!env.KAFKA_CA_PATH) {
    throw new AppError({
      statusCode: 500,
      code: ErrorCodes.KAFKA_CONNECTION_ERROR,
      message: 'KAFKA_CA_PATH is required when Kafka is enabled',
    });
  }

  const caPath = path.resolve(env.KAFKA_CA_PATH);

  try {
    const caCertificate = fs.readFileSync(caPath);

    // Log the path only. Never log the certificate contents.
    logger.debug(`Kafka CA certificate loaded from: ${caPath}`);

    return {
      ca: [caCertificate],
    };
  } catch (error) {
    throw new AppError({
      statusCode: 500,
      code: ErrorCodes.KAFKA_CONNECTION_ERROR,
      message: `Failed to load Kafka CA certificate: ${caPath}`,
      cause: error,
    });
  }
}

/**
 * Kafka client configuration.
 *
 * This creates the client but does not establish a connection.
 * Connection lifecycle is managed by kafka.connection.ts.
 *
 * When Kafka is disabled, local placeholder configuration is used
 * so that the Kafka client can be constructed without requiring
 * Kafka-specific environment variables or certificates.
 */
export const kafka = new Kafka({
  clientId: env.KAFKA_CLIENT_ID,
  brokers: env.KAFKA_ENABLED ? getKafkaBrokers() : ['localhost:9092'],
  ssl: env.KAFKA_ENABLED ? getKafkaSslConfig() : false,
  sasl: getSaslConfig(),
  logLevel: logLevel.WARN,
});
