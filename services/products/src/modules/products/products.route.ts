import { Router } from 'express';
import { getProductById } from './products.controller.js';
import { asyncHandler } from '../../shared/utils/async-handler.js';

const productRouter = Router();

productRouter.get('/:id', asyncHandler(getProductById));

export default productRouter;
