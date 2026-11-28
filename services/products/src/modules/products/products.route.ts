import { Router } from 'express';
import { getProductByIdController, listProductsController } from './products.controller.js';
import {
  validateListProducts,
  validateProductId,
  validateStockUpdate,
} from './product.validation.js';

const productRouter = Router();

productRouter.get('/:id', validateProductId, getProductByIdController);
productRouter.get('/', validateListProducts, listProductsController);

export default productRouter;
