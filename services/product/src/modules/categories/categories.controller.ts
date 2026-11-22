import type { Request, Response } from 'express';
import { listCategories, findCategoryBySlug } from './categories.service.js';
import { ValidationError } from '../../shared/errors/validation-error.js';

export async function getCategories(_req: Request, res: Response) {
  const categories = await listCategories();
  res.status(200).json({
    success: true,
    data: categories,
  });
}

export async function getCategoryBySlug(req: Request, res: Response) {
  const slug = req.params.slug as string;
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new ValidationError('Category slug has an invalid format.');
  }
  const category = await findCategoryBySlug(slug);
  res.status(200).json({
    success: true,
    data: category,
  });
}
