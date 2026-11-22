import { Router } from 'express';
import {
  getProducts,
  getProductById,
  getProductAvailability,
  patchProductStock,
} from './products.controller.js';
const router = Router();

router.get('/', getProducts);
// Register the more specific route before /:id.
router.get('/:id/availability', getProductAvailability);
router.get('/:id', getProductById);
// Internal-only: add auth/authorization middleware before enabling this route.
router.patch('/:id/stock', patchProductStock);
export default router;
