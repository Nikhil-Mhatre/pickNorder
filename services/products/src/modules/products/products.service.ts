import { db } from '../../prisma/db.js';
import { AppError } from '../../shared/errors/app-error.js';
import { ErrorCodes } from '../../shared/errors/error-codes.js';
import type { GetProductByIdOutputSchema, ListProductsInput } from './product.types.js';

export async function getProductById(productId: string): Promise<GetProductByIdOutputSchema> {
  const product = await db.orm.public.Product.whereUnique({ id: productId })
    .select(
      'id',
      'name',
      'description',
      'price',
      'imageUrl',
      'categoryId',
      'status',
      'createdAt',
      'updatedAt',
    )
    .first();

  // Do not reveal whether an inactive product exists.
  if (!product || product.status === 'INACTIVE') {
    throw new AppError({
      statusCode: 404,
      code: ErrorCodes.PRODUCT_NOT_FOUND,
      message: 'Product not found.',
    });
  }

  const category = await db.orm.public.Category.whereUnique({ id: product.categoryId })
    .select('id', 'name', 'slug', 'description')
    .first();

  // Products in inactive categories are not publicly visible.
  if (!category) {
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
    category: {
      id: category.id,
      name: category.name,
      slug: category.slug,
    },
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
}

export const listProducts = async (input: ListProductsInput) => {
  const { page, limit, category, search, sortBy, sortOrder } = input;

  const offset = (page - 1) * limit;

  // Select all categories
  const categories = await db.orm.public.Category.select('id').all();

  const categoryIds = categories.map((item) => item.id);

  // If category slug is provided, resolve it.
  let selectedCategoryId: string | undefined;

  if (category) {
    const selectedCategory = await db.orm.public.Category.whereUnique({ slug: category })
      .select('id')
      .first();

    // Category doesn't exist or isn't active.
    if (!selectedCategory) {
      return {
        data: [],
        pagination: {
          page,
          limit,
          totalItems: 0,
          totalPages: 0,
        },
      };
    }

    selectedCategoryId = selectedCategory.id;
  }

  // Build common filtering logic.
  const buildFilteredQuery = () => {
    let query = db.orm.public.Product.where({ status: 'ACTIVE' }).where((p) =>
      p.categoryId.in(categoryIds),
    );

    if (selectedCategoryId) {
      query = query.where({
        categoryId: selectedCategoryId,
      });
    }

    if (search) {
      query = query.where((p) => p.name.ilike(`%${search}%`));
    }

    return query;
  };

  // Count all matching products, independent of pagination.
  const { total } = await buildFilteredQuery().aggregate((aggregate) => ({
    total: aggregate.count(),
  }));

  // Sorting.
  const buildSortedQuery = () => {
    const query = buildFilteredQuery();

    if (sortBy === 'name') {
      return sortOrder === 'asc'
        ? query.orderBy([(p) => p.name.asc(), (p) => p.id.asc()])
        : query.orderBy([(p) => p.name.desc(), (p) => p.id.asc()]);
    }

    if (sortBy === 'price') {
      return sortOrder === 'asc'
        ? query.orderBy([(p) => p.price.asc(), (p) => p.id.asc()])
        : query.orderBy([(p) => p.price.desc(), (p) => p.id.asc()]);
    }

    return sortOrder === 'asc'
      ? query.orderBy([(p) => p.createdAt.asc(), (p) => p.id.asc()])
      : query.orderBy([(p) => p.createdAt.desc(), (p) => p.id.asc()]);
  };

  const products = await buildSortedQuery()
    .limit(limit)
    .offset(offset)
    .select('id', 'name', 'description', 'price', 'imageUrl', 'status', 'createdAt', 'updatedAt')
    .include('category', (category) => category.select('id', 'name', 'slug'))
    .all();

  const totalPages = Math.ceil(total / limit);

  return {
    data: products.map((product) => ({
      ...product,
      price: product.price.toString(),
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
    })),

    pagination: {
      page,
      limit,
      totalItems: total,
      totalPages,
    },
  };
};
