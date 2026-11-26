import { Request, Response } from 'express';
import {
  getProductById as fetchProductById,
  GetProductsQuery,
  getProducts as fetchProducts,
} from './products.service.js';
import { ValidationError } from '../../shared/errors/validation-error.js';

export const getProductById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!id || typeof id !== 'string') {
    throw new ValidationError('Invalid product ID');
  }
  const product = await fetchProductById(id);

  res.status(200).json({
    success: true,
    data: product,
  });
};

export const getProducts = async (req: Request, res: Response): Promise<void> => {
  const query = res.locals.productsQuery as GetProductsQuery;

  const result = await fetchProducts(query);

  res.status(200).json({
    success: true,
    data: result.products,
    meta: {
      pagination: result.pagination,
    },
  });
};
