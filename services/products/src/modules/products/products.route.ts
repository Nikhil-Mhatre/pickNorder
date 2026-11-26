import { Router } from 'express';
import { getProductById, getProducts } from './products.controller.js';
import { asyncHandler } from '../../shared/utils/async-handler.js';
import { validateGetProductsQuery } from './products.validation.js';

const productRouter = Router();

productRouter.get('/:id', asyncHandler(getProductById));
productRouter.get('/', validateGetProductsQuery, asyncHandler(getProducts));

export default productRouter;
