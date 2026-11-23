import { Router } from 'express';
import { livenessCheck, readinessCheck } from './health.controller.js';

const healthRouter = Router();

healthRouter.get('/live', livenessCheck);
healthRouter.get('/ready', readinessCheck);

export default healthRouter;
