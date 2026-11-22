import type { Request, Response } from 'express';
import {
  listProducts,
  findProductById,
  findProductAvailability,
  adjustStock,
} from './products.service.js';
import { parseProductListInput } from './products.validator.js';
import { parseStockAdjustment } from './stock.validator.js';

const getProductId = (req: Request): string => {
  const id = req.params.id;

  if (Array.isArray(id)) {
    return id[0] ?? '';
  }

  return id;
};

const getProducts = async (req: Request, res: Response): Promise<void> => {
  // Validate query parameters and apply default values.
  const input = parseProductListInput(req.query as Record<string, unknown>);
  const { products, totalItems } = await listProducts(input);
  const totalPages = Math.ceil(totalItems / input.limit);

  // Return the product list and pagination metadata.
  res.status(200).json({
    success: true,
    data: products,
    pagination: { page: input.page, limit: input.limit, totalItems, totalPages },
  });
};

const patchProductStock = async (req: Request, res: Response): Promise<void> => {
  const id = getProductId(req);

  if (!id) {
    res.status(400).json({
      success: false,
      message: 'Product ID is required',
    });
    return;
  }

  const input = parseStockAdjustment(req.body);
  const product = await adjustStock(id, input);

  res.status(200).json({
    success: true,
    message: 'Stock adjusted successfully',
    data: product,
  });
};

const getProductAvailability = async (req: Request, res: Response): Promise<void> => {
  const id = getProductId(req);

  if (!id) {
    res.status(400).json({
      success: false,
      message: 'Product ID is required',
    });
    return;
  }

  const product = await findProductAvailability(id);

  res.status(200).json({
    success: true,
    productId: product?.id,
    available: product != undefined && product.stock > 0,
    stock: product?.stock,
  });
};

const getProductById = async (req: Request, res: Response): Promise<void> => {
  const id = getProductId(req);

  if (!id) {
    res.status(400).json({
      success: false,
      message: 'Product ID is required',
    });
    return;
  }

  const product = await findProductById(id);

  res.status(200).json({
    success: true,
    data: product,
  });
};

export { getProducts, patchProductStock, getProductAvailability, getProductById };
