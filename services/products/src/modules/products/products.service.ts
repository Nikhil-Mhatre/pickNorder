import { db } from '../../prisma/db.js';
import { AppError } from '../../shared/errors/app-error.js';
import { ErrorCodes } from '../../shared/errors/error-codes.js';
import type {
  GetProductByIdOutputSchema,
  ListProductsInput,
  UpdateStockInput,
} from './product.types.js';

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

export async function updateProductStock(productId: string, input: UpdateStockInput) {
  const { operation, quantity } = input;

  // Atomic stock adjustment.
  // DECREASE additionally checks stock >= quantity in the UPDATE.
  const stockUpdateQuery =
    operation === 'INCREASE'
      ? db.raw.sql`
          UPDATE "Product"
          SET "stock" = "stock" + ${quantity}
          WHERE "id" = ${productId}
            AND "isActive" = true
          RETURNING "id", "name", "stock"
        `
          .returnsRow({
            id: 'pg/text@1',
            name: 'pg/text@1',
            stock: 'pg/int4@1',
          })
          .build()
      : db.raw.sql`
          UPDATE "Product"
          SET "stock" = "stock" - ${quantity}
          WHERE "id" = ${productId}
            AND "isActive" = true
            AND "stock" >= ${quantity}
          RETURNING "id", "name", "stock"
        `
          .returnsRow({
            id: 'pg/text@1',
            name: 'pg/text@1',
            stock: 'pg/int4@1',
          })
          .build();

  const updatedRows = await db.query(stockUpdateQuery);
  const updatedProduct = updatedRows[0];

  // No row updated: distinguish not-found/inactive from insufficient stock.
  if (!updatedProduct) {
    // This should throw PRODUCT_NOT_FOUND if the product is
    // missing or inactive.
    await getProductById(productId);

    throw new AppError({
      statusCode: 409,
      code: ErrorCodes.INSUFFICIENT_STOCK,
      message: 'Insufficient stock to complete this adjustment.',
    });
  }

  // Return the standard product details, with the stock value
  // produced by the atomic UPDATE.
  const product = await getProductById(productId);

  return {
    ...product,
    stock: updatedProduct.stock,
  };
}

export const listProducts = async (input: ListProductsInput) => {
  const { page, limit, category, search, sortBy, sortOrder } = input;

  const offset = (page - 1) * limit;

  // Only active categories are eligible for public products.
  const activeCategories = await db.orm.public.Category.where({ isActive: true })
    .select('id')
    .all();

  const activeCategoryIds = activeCategories.map((item) => item.id);

  // If no active categories exist, return an empty catalog.
  if (activeCategoryIds.length === 0) {
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

  // If category slug is provided, resolve it.
  let selectedCategoryId: string | undefined;

  if (category) {
    const selectedCategory = await db.orm.public.Category.whereUnique({ slug: category })
      .select('id', 'isActive')
      .first();

    // Category doesn't exist or isn't active.
    if (!selectedCategory || !selectedCategory.isActive) {
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
    let query = db.orm.public.Product.where({ isActive: true }).where((p) =>
      p.categoryId.in(activeCategoryIds),
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
    .select(
      'id',
      'name',
      'description',
      'price',
      'imageUrl',
      'stock',
      'isActive',
      'createdAt',
      'updatedAt',
    )
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
