import { db } from '../../prisma/db.js';
import { AppError } from '../../shared/errors/app-error.js';
import { ErrorCodes } from '../../shared/errors/error-codes.js';
import { CategoryResponse } from './categories.types.js';

export const listCategories = async (): Promise<CategoryResponse[]> => {
  const categories = await db.orm.public.Category.where({ isActive: true })
    .select('id', 'name', 'slug', 'description')
    .orderBy((category) => category.name.asc())
    .all();

  const activeProducts = await db.orm.public.Product.where({ isActive: true })
    .select('categoryId')
    .all();

  const productCounts = new Map<string, number>();

  for (const product of activeProducts) {
    productCounts.set(product.categoryId, (productCounts.get(product.categoryId) ?? 0) + 1);
  }

  return categories.map((category) => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description,
    productCount: productCounts.get(category.id) ?? 0,
  }));
};

export const getCategoryBySlug = async (slug: string): Promise<CategoryResponse> => {
  const category = await db.orm.public.Category.whereUnique({ slug })
    .select('id', 'name', 'slug', 'description', 'isActive')
    .first();

  if (!category || !category.isActive) {
    throw new AppError({
      statusCode: 404,
      code: ErrorCodes.CATEGORY_NOT_FOUND,
      message: 'Category not found.',
    });
  }

  const activeProducts = await db.orm.public.Product.where({
    categoryId: category.id,
    isActive: true,
  })
    .select('id')
    .all();

  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description,
    productCount: activeProducts.length,
  };
};
