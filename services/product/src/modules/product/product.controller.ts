import type { Request, Response } from 'express';
import type { z } from 'zod';

import { AppError } from '../../shared/errors/app-error.js';
import { ErrorCodes } from '../../shared/errors/error-codes.js';

import { productService } from './product.service.js';

import {
  productListQuerySchema,
  productIdSchema,
  stockAdjustmentSchema,
} from './product.validator.js';

const validate = <T extends z.ZodType>(schema: T, data: unknown): z.infer<T> => {
  const result = schema.safeParse(data);

  if (result.success === false) {
    throw new AppError({
      statusCode: 400,
      errorCode: ErrorCodes.VALIDATION_ERROR,
      message: 'Invalid request data',
      details: result.error.issues,
    });
  }

  return result.data;
};

export const listProducts = async (req: Request, res: Response): Promise<void> => {
  const query = validate(productListQuerySchema, req.query);

  const result = await productService.listProducts(query);

  res.status(200).json({
    success: true,
    data: result.products,
    pagination: result.pagination,
  });
};

export const getProductById = async (req: Request, res: Response): Promise<void> => {
  const params = validate(productIdSchema, req.params);

  const product = await productService.getProductById(params.id);

  res.status(200).json({
    success: true,
    data: product,
  });
};

export const checkProductAvailability = async (req: Request, res: Response): Promise<void> => {
  const params = validate(productIdSchema, req.params);

  const availability = await productService.checkAvailability(params.id);

  res.status(200).json({
    success: true,
    data: availability,
  });
};

export const adjustProductStock = async (req: Request, res: Response): Promise<void> => {
  const params = validate(productIdSchema, req.params);
  const body = validate(stockAdjustmentSchema, req.body);

  const product = await productService.adjustStock(params.id, body);

  res.status(200).json({
    success: true,
    message: 'Stock updated successfully',
    data: product,
  });
};
