import { randomUUID } from 'node:crypto';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';
import { logger } from './shared/utils/logger.js';
import { notFoundHandler } from './shared/middleware/not-found.middleware.js';
import { errorHandler } from './shared/middleware/error-handler.middleware.js';
import healthRouter from './modules/health/health.routes.js';

const requestIdPattern = /^[a-zA-Z0-9._-]{1,128}$/;

export const app = express();

app.disable('x-powered-by');
app.use(
  pinoHttp({
    logger,
    genReqId: (req, res) => {
      const header = req.headers['x-request-id'];
      const requestId =
        typeof header === 'string' && requestIdPattern.test(header) ? header : randomUUID();

      res.setHeader('x-request-id', requestId);
      return requestId;
    },
    customProps: () => ({ service: 'product-service' }),
    customAttributeKeys: { reqId: 'requestId' },
    serializers: {
      req: (req) => ({
        id: req.id,
        method: req.method,
        // Exclude query strings because they can contain tokens or personal data.
        url: req.url.split('?')[0],
      }),
      res: (res) => ({ statusCode: res.statusCode }),
    },
    customLogLevel: (_req, res, err) => {
      if (err || res.statusCode >= 500) return 'error';
      if (res.statusCode >= 400) return 'warn';
      return 'info';
    },
  }),
);

// 2. Security
app.use(helmet());

// 3. CORS
app.use(cors(/* config */));

// 4. Parsers
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// 5. Routes
// Health endpoints
app.use('/health', healthRouter);

// 6. Unknown routes
app.use(notFoundHandler);

// 7. Central error handler — ALWAYS LAST
app.use(errorHandler);
