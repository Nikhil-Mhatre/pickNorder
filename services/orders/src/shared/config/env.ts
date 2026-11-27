import 'dotenv/config';
import { z } from 'zod';

const booleanFromEnv = z.enum(['true', 'false']).transform((value) => value === 'true');

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(3001),
    DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
    CORS_ORIGIN: z.string().default('http://localhost:5173'),
    LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).optional(),

    // Kafka
    KAFKA_ENABLED: booleanFromEnv.default('false'),
    KAFKA_CLIENT_ID: z.string().default('picknorder-orders-service'),
    KAFKA_BROKERS: z.string().default('localhost:9092'),
    KAFKA_SASL_MECHANISM: z.enum(['scram-sha-256', 'scram-sha-512']).default('scram-sha-256'),
    KAFKA_SASL_USERNAME: z.string().optional(),
    KAFKA_SASL_PASSWORD: z.string().optional(),
    KAFKA_CA_PATH: z.string().optional(),
  })
  .superRefine((config, ctx) => {
    if (!config.KAFKA_ENABLED) {
      return;
    }

    if (!config.KAFKA_BROKERS.trim()) {
      ctx.addIssue({
        code: 'custom',
        path: ['KAFKA_BROKERS'],
        message: 'KAFKA_BROKERS cannot be empty when Kafka is enabled',
      });
    }

    if (!config.KAFKA_SASL_USERNAME) {
      ctx.addIssue({
        code: 'custom',
        path: ['KAFKA_SASL_USERNAME'],
        message: 'KAFKA_SASL_USERNAME is required when Kafka is enabled',
      });
    }

    if (!config.KAFKA_SASL_PASSWORD) {
      ctx.addIssue({
        code: 'custom',
        path: ['KAFKA_SASL_PASSWORD'],
        message: 'KAFKA_SASL_PASSWORD is required when Kafka is enabled',
      });
    }
  });

export const env = envSchema.parse(process.env);
