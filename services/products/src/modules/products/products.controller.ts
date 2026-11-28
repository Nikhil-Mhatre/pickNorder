import { asyncHandler } from '../../shared/utils/async-handler.js';
import { buildSuccessResponse } from '../../shared/responses/success-response.js';
import { getProductById, listProducts } from './products.service.js';

export const getProductByIdController = asyncHandler(async (req, res) => {
  const product = await getProductById(res.locals.productId);

  res.status(200).json(buildSuccessResponse({ data: product }));
});

export const listProductsController = asyncHandler(async (_req, res) => {
  const result = await listProducts(res.locals.query);

  res.status(200).json({
    success: true,
    data: result.data,
    pagination: result.pagination,
  });
});
