import { Router } from 'express';
import {
  listProducts,
  getProductById,
  checkProductAvailability,
  adjustProductStock,
} from './product.controller.js';
import { asyncHandler } from '../../shared/utils/async-handler.js';

const productRouter = Router();

productRouter.get('/', asyncHandler(listProducts));

productRouter.get('/:id/availability', asyncHandler(checkProductAvailability));

productRouter.get('/:id', asyncHandler(getProductById));

productRouter.patch('/:id/stock', asyncHandler(adjustProductStock));

export default productRouter;
