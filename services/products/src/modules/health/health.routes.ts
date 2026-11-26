import { Router } from 'express';

import { livenessController, readinessController } from './health.controller.js';

const healthRouter = Router();

healthRouter.get('/live', livenessController);
healthRouter.get('/ready', readinessController);

export default healthRouter;
