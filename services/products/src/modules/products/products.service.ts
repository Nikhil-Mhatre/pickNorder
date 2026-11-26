import { Models } from '../../prisma/contract.js';
import { db } from '../../prisma/db.js';
import type { Scalars } from '@prisma/orm-postgres/family-contract/types';
import { ProductNotFoundError } from '../../shared/errors/product-not-found.error.js';
import { ValidationError } from '../../shared/errors/validation-error.js';

type ProductT = Scalars<Models.public_Product>;

export type ProductSortBy = 'createdAt' | 'name' | 'price' | 'stock';
export type SortOrder = 'asc' | 'desc';

export interface GetProductsQuery {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  minPrice?: string;
  maxPrice?: string;
  inStock?: boolean;
  sortBy?: ProductSortBy;
  sortOrder?: SortOrder;
}

export interface GetProductsOutput {
  products: ProductT[] | [];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

const ALLOWED_SORT_FIELDS: ProductSortBy[] = ['createdAt', 'name', 'price', 'stock'];

export async function getProductById(productId: string): Promise<ProductT> {
  const product = await db.orm.public.Product.where({
    id: productId,
    isActive: true,
  })
    .include('category')
    .first();

  if (!product) throw new ProductNotFoundError(productId);

  return product;
}

export async function getProducts(query: GetProductsQuery): Promise<GetProductsOutput> {
  const {
    page = DEFAULT_PAGE,
    limit = DEFAULT_LIMIT,
    search,
    category,
    minPrice,
    maxPrice,
    inStock,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  }: GetProductsQuery = query;

  // Defensive validation
  if (!Number.isInteger(page) || page < 1) {
    throw new ValidationError('Page must be a positive integer.');
  }

  if (!Number.isInteger(limit) || limit < 1 || limit > MAX_LIMIT) {
    throw new ValidationError(`Limit must be between 1 and ${MAX_LIMIT}.`);
  }

  if (!ALLOWED_SORT_FIELDS.includes(sortBy)) {
    throw new ValidationError('Invalid sort field.');
  }

  if (sortOrder !== 'asc' && sortOrder !== 'desc') {
    throw new ValidationError('Invalid sort order.');
  }

  if (minPrice !== undefined && maxPrice !== undefined && Number(minPrice) > Number(maxPrice)) {
    throw new ValidationError('minPrice cannot be greater than maxPrice.');
  }

  const skip = (page - 1) * limit;

  // Resolve category slug, if provided.
  // Inactive categories must never be exposed in the public catalog.
  let categoryId: string | undefined;

  if (category?.trim()) {
    const matchedCategory = await db.orm.public.Category.where({
      slug: category.trim(),
      isActive: true,
    })
      .select('id')
      .first();

    // Unknown or inactive category => no products.
    if (!matchedCategory) {
      return {
        products: [],
        pagination: {
          page,
          limit,
          totalItems: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      };
    }

    categoryId = matchedCategory.id;
  }

  // Get active category IDs to prevent products from inactive
  // categories from appearing in the public catalog.
  const activeCategoryIds = categoryId
    ? [categoryId]
    : (await db.orm.public.Category.where({ isActive: true }).select('id').all()).map(
        (category) => category.id,
      );

  // No active categories => no publicly visible products.
  if (activeCategoryIds.length === 0) {
    return {
      products: [],
      pagination: {
        page,
        limit,
        totalItems: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    };
  }

  // Base product query.
  // Every public catalog request excludes inactive products
  // and products belonging to inactive categories.
  let baseQuery = db.orm.public.Product.where({ isActive: true }).where((p) =>
    p.categoryId.in(activeCategoryIds),
  );

  // Search by product name (case-insensitive).
  if (search?.trim()) {
    const searchTerm = search.trim();

    baseQuery = baseQuery.where((p) => p.name.ilike(`%${searchTerm}%`));
  }

  // Category filter.
  if (categoryId) {
    baseQuery = baseQuery.where({ categoryId });
  }

  // Price range.
  if (minPrice !== undefined) {
    baseQuery = baseQuery.where((p) => p.price.gte(minPrice));
  }

  if (maxPrice !== undefined) {
    baseQuery = baseQuery.where((p) => p.price.lte(maxPrice));
  }

  // Inventory filter.
  if (inStock === true) {
    baseQuery = baseQuery.where((p) => p.stock.gt(0));
  }

  if (inStock === false) {
    baseQuery = baseQuery.where({ stock: 0 });
  }

  // Sorting with typed Prisma ORM 8
  const fetchProducts = (sortBy: ProductSortBy, sortOrder: SortOrder) => {
    switch (sortBy) {
      case 'name':
        return baseQuery
          .orderBy([(p) => (sortOrder === 'asc' ? p.name.asc() : p.name.desc()), (p) => p.id.asc()])
          .limit(limit)
          .offset(skip)
          .include('category', (c) => c.select('id', 'name', 'slug'))
          .all();

      case 'price':
        return baseQuery
          .orderBy([
            (p) => (sortOrder === 'asc' ? p.price.asc() : p.price.desc()),
            (p) => p.id.asc(),
          ])
          .limit(limit)
          .offset(skip)
          .include('category', (c) => c.select('id', 'name', 'slug'))
          .all();

      case 'stock':
        return baseQuery
          .orderBy([
            (p) => (sortOrder === 'asc' ? p.stock.asc() : p.stock.desc()),
            (p) => p.id.asc(),
          ])
          .limit(limit)
          .offset(skip)
          .include('category', (c) => c.select('id', 'name', 'slug'))
          .all();

      case 'createdAt':
      default:
        return baseQuery
          .orderBy([
            (p) => (sortOrder === 'asc' ? p.createdAt.asc() : p.createdAt.desc()),
            (p) => p.id.asc(),
          ])
          .limit(limit)
          .offset(skip)
          .include('category', (c) => c.select('id', 'name', 'slug'))
          .all();
    }
  };

  // Fetch products and total count concurrently.
  const [products, aggregate] = await Promise.all([
    fetchProducts(sortBy, sortOrder),

    baseQuery.aggregate((a) => ({
      totalItems: a.count(),
    })),
  ]);

  const totalItems = aggregate.totalItems;
  const totalPages = Math.ceil(totalItems / limit);

  return {
    products,
    pagination: {
      page,
      limit,
      totalItems,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1 && totalItems > 0,
    },
  };
}
