import { Request, Response } from 'express';
import { getProductById as getProduct } from './products.service.js';
import { ValidationError } from '../../shared/errors/validation-error.js';

export const getProductById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!id || typeof id !== 'string') {
    throw new ValidationError('Invalid product ID');
  }
  const product = await getProduct(id);

  res.status(200).json({
    success: true,
    data: product,
  });
};
