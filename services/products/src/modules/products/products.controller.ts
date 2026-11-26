import { asyncHandler } from '../../shared/utils/async-handler.js';
import { buildSuccessResponse } from '../../shared/responses/success-response.js';
import { getProductById } from './products.service.js';

export const getProductByIdController = asyncHandler(async (req, res) => {
  const product = await getProductById(res.locals.productId);

  res.status(200).json(buildSuccessResponse({ data: product }));
});
