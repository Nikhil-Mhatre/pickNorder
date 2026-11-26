import { asyncHandler } from '../../shared/utils/async-handler.js';

import { listCategories, getCategoryBySlug } from './categories.service.js';

export const listCategoriesController = asyncHandler(async (_req, res) => {
  const categories = await listCategories();

  res.status(200).json({
    success: true,
    data: categories,
  });
});

export const getCategoryBySlugController = asyncHandler(async (_req, res) => {
  const category = await getCategoryBySlug(res.locals.slug);

  res.status(200).json({
    success: true,
    data: category,
  });
});
