import { db } from '../../prisma/db.js';
import { AppError } from '../../shared/errors/app-error.js';
import { ErrorCodes } from '../../shared/errors/error-codes.js';
import type { GetProductByIdOutputSchema } from './product.types.js';

export async function getProductById(productId: string): Promise<GetProductByIdOutputSchema> {
  const product = await db.orm.public.Product.whereUnique({ id: productId })
    .select(
      'id',
      'name',
      'description',
      'price',
      'imageUrl',
      'stock',
      'categoryId',
      'isActive',
      'createdAt',
      'updatedAt',
    )
    .first();

  // Do not reveal whether an inactive product exists.
  if (!product || !product.isActive) {
    throw new AppError({
      statusCode: 404,
      code: ErrorCodes.PRODUCT_NOT_FOUND,
      message: 'Product not found.',
    });
  }

  const category = await db.orm.public.Category.whereUnique({ id: product.categoryId })
    .select('id', 'name', 'slug', 'isActive')
    .first();

  // Products in inactive categories are not publicly visible.
  if (!category || !category.isActive) {
    throw new AppError({
      statusCode: 404,
      code: ErrorCodes.PRODUCT_NOT_FOUND,
      message: 'Product not found.',
    });
  }

  return {
    id: product.id,
    name: product.name,
    description: product.description,
    price: product.price,
    imageUrl: product.imageUrl,
    stock: product.stock,
    category: {
      id: category.id,
      name: category.name,
      slug: category.slug,
    },
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
}
