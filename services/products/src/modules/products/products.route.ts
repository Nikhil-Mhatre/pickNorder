import { Router } from 'express';
import { getProductByIdController } from './products.controller.js';
import { validateProductId } from './product.validation.js';

const productRouter = Router();

productRouter.get('/:id', validateProductId, getProductByIdController);

export default productRouter;
