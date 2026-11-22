import { orderByField } from '@prisma/orm-postgres/orm-client';
import { db } from '../../prisma/db.js';
import { ProductNotFoundError } from '../../shared/errors/product-not-found.error.js';
import { InsufficientStockError } from '../../shared/errors/insufficient-stock.error.js';
import type { StockAdjustmentInput } from './stock.validator.js';
import type { ProductListInput } from './products.validator.js';

const Product = db.orm.public.Product;
const Category = db.orm.public.Category;

/** List products and the total number matching the same filters. */
export async function listProducts(input: ProductListInput) {
  // Resolve the category slug first. This also ensures inactive categories
  // are not treated as valid public catalog filters.
  let categoryId: string | undefined;
  if (input.category) {
    const category = await Category.where({ slug: input.category, isActive: true }).first();
    if (!category) {
      return { products: [], totalItems: 0 };
    }
    categoryId = category.id;
  }

  // Build the filter one condition at a time. Multiple where() calls are ANDed.
  let filteredProducts = Product.where({ isActive: true });
  if (categoryId) {
    filteredProducts = filteredProducts.where({ categoryId });
  }
  if (input.search) {
    filteredProducts = filteredProducts.where((product) => product.name.ilike(`%${input.search}%`));
  }

  const offset = (input.page - 1) * input.limit;
  const sort = orderByField(Product, input.sortBy, input.sortOrder, ['name', 'price', 'createdAt']);

  const [products, count] = await Promise.all([
    filteredProducts.include('category').orderBy(sort).offset(offset).limit(input.limit).all(),
    filteredProducts.aggregate((agg) => ({ total: agg.count() })),
  ]);

  return { products, totalItems: count.total };
}

/** Find one active product by its identifier. */
export async function findProductById(id: string) {
  const product = Product.where({ id, isActive: true }).include('category').first();
  if (!product && product !== null) throw new ProductNotFoundError(id);
  return product;
}

/** Return the small payload used by the stock availability endpoint. */
export async function findProductAvailability(id: string) {
  const product = Product.where({ id, isActive: true }).select('id', 'stock').first();
  if (!product) throw new ProductNotFoundError(id);
  return product;
}

/**
 * Change inventory through one conditional SQL UPDATE.
 * The condition and arithmetic run in PostgreSQL itself, so a concurrent
 * decrement cannot take stock below zero.
 */
export async function adjustStock(id: string, input: StockAdjustmentInput) {
  let statement;

  if (input.operation === 'INCREASE') {
    statement = db.raw.sql`
      UPDATE "Product"
      SET "stock" = "stock" + ${input.quantity}
      WHERE "id" = ${id}
    `
      .affectedCount()
      .build();
  } else {
    statement = db.raw.sql`
      UPDATE "Product"
      SET "stock" = "stock" - ${input.quantity}
      WHERE "id" = ${id}
        AND "stock" >= ${input.quantity}
    `
      .affectedCount()
      .build();
  }

  const updateResult = await db.execute(statement);
  if (updateResult.affectedRows === 0) {
    const existing = await Product.where({ id }).select('id', 'stock').first();
    if (!existing) {
      throw new ProductNotFoundError(id);
    }
    throw new InsufficientStockError(id, input.quantity);
  }

  const product = await Product.where({ id }).include('category').first();
  if (!product) {
    throw new ProductNotFoundError(id);
  }
  return product;
}
