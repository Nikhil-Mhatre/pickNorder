import { Router } from 'express';
import {
  getProductByIdController,
  listProductsController,
  updateProductStockController,
} from './products.controller.js';
import {
  validateListProducts,
  validateProductId,
  validateStockUpdate,
} from './product.validation.js';

const productRouter = Router();

productRouter.get('/:id', validateProductId, getProductByIdController);
productRouter.patch('/:id/stock', validateStockUpdate, updateProductStockController);
productRouter.get('/', validateListProducts, listProductsController);

export default productRouter;
