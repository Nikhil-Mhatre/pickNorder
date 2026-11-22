import { db } from '../../prisma/db.js';
import { CategoryNotFoundError } from '../../shared/errors/category-not-found.error.js';
const Category = db.orm.public.Category;

/** List active categories with counts of active products in each category. */
export async function listCategories() {
  const rows = await Category.where({ isActive: true })
    .include('products', (products) => products.where({ isActive: true }).count())
    .orderBy((category) => category.name.asc())
    .all();

  // Rename the included relation count to match the API contract.
  return rows.map(({ products, ...category }) => ({
    ...category,
    productCount: products,
  }));
}

/** Fetch one active category by slug, including its active product count. */
export async function findCategoryBySlug(slug: string) {
  const category = await Category.where({ slug, isActive: true })
    .include('products', (products) => products.where({ isActive: true }).count())
    .first();

  if (!category) {
    throw new CategoryNotFoundError(slug);
  }

  const { products, ...categoryFields } = category;
  return { ...categoryFields, productCount: products };
}
