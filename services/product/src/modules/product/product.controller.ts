import type { Request, Response } from 'express';
import type { z } from 'zod';

import { AppError } from '../../shared/errors/app-error.js';
import { ErrorCodes } from '../../shared/errors/error-codes.js';

import { productService } from './product.service.js';
import { productListQuerySchema, productIdSchema, stockAdjustmentSchema } from './product.types.js';

// ---------------------------------------------
// Product Controller
// ---------------------------------------------
// Responsibilities:
// 1. Validate incoming HTTP request data.
// 2. Call the appropriate service method.
// 3. Return a consistent HTTP response.
//
// Business logic belongs in product.service.ts.
// Database queries belong in product.repository.ts.
// ---------------------------------------------

/**
 * Validate request data using a Zod schema.
 *
 * safeParse() allows us to handle validation failures
 * without throwing a raw Zod error.
 *
 * If validation fails, we throw our application error
 * so the global error middleware can format the response.
 *
 * If validation succeeds, return the parsed data.
 * This includes Zod transformations and default values.
 */
const validateRequest = <T extends z.ZodType>(schema: T, data: unknown): z.infer<T> => {
  const result = schema.safeParse(data);

  // Stop request processing if validation fails.
  if (!result.success) {
    throw new AppError({
      statusCode: 400,
      errorCode: ErrorCodes.VALIDATION_ERROR,
      message: 'Invalid request data',
      details: result.error.issues,
    });
  }

  // Return validated and transformed data.
  return result.data;
};

// ---------------------------------------------
// GET /api/products
// ---------------------------------------------

/**
 * List products with filtering, sorting, and pagination.
 *
 * Query parameters are validated before reaching the service.
 * Zod applies defaults for page, limit, sortBy, and sortOrder.
 */
export const listProducts = async (req: Request, res: Response): Promise<void> => {
  // Validate query parameters and apply default values.
  const query = validateRequest(productListQuerySchema, req.query);

  // Fetch products and pagination metadata from the service.
  const result = await productService.listProducts(query);

  // Return the product list and pagination metadata.
  res.status(200).json({
    success: true,
    data: result.products,
    pagination: result.pagination,
  });
};

// ---------------------------------------------
// GET /api/products/:id
// ---------------------------------------------

/**
 * Get details for a single active product.
 */
export const getProductById = async (req: Request, res: Response): Promise<void> => {
  // Validate the product ID from route parameters.
  const params = validateRequest(productIdSchema, req.params);

  // Retrieve the product from the service.
  const product = await productService.getProductById(params.id);

  // Return the product details.
  res.status(200).json({
    success: true,
    data: product,
  });
};

// ---------------------------------------------
// GET /api/products/:id/availability
// ---------------------------------------------

/**
 * Check whether a product currently has available stock.
 */
export const checkProductAvailability = async (req: Request, res: Response): Promise<void> => {
  // Validate the product ID from route parameters.
  const params = validateRequest(productIdSchema, req.params);

  // Check product stock through the service.
  const availability = await productService.checkAvailability(params.id);

  // Return the availability information.
  res.status(200).json({
    success: true,
    data: availability,
  });
};

// ---------------------------------------------
// PATCH /api/products/:id/stock
// ---------------------------------------------

/**
 * Increase or decrease product stock.
 *
 * The product ID comes from the URL.
 * The operation and quantity come from the request body.
 */
export const adjustProductStock = async (req: Request, res: Response): Promise<void> => {
  // Validate the product ID from the route.
  const params = validateRequest(productIdSchema, req.params);

  // Validate the stock adjustment payload.
  const body = validateRequest(stockAdjustmentSchema, req.body);

  // Perform the stock adjustment through the service.
  const product = await productService.adjustStock(params.id, body);

  // Return the updated product with a success message.
  res.status(200).json({
    success: true,
    message: 'Stock updated successfully',
    data: product,
  });
};
