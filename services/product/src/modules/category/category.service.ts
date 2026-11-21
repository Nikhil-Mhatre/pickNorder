import { CategoryNotFoundError } from '../../shared/errors/category-not-found.error.js';
import { categoryRepository } from './category.repository.js';

// ---------------------------------------------
// Category Service
// ---------------------------------------------
// This file contains category-related business logic.
//
// Responsibilities:
// - Retrieve categories through the repository.
// - Convert database results into API-friendly responses.
// - Handle category not-found scenarios.
//
// Database queries belong in the repository.
// HTTP request/response handling belongs in the controller.
// ---------------------------------------------

/**
 * Convert a Prisma category result into the API response format.
 *
 * Prisma returns the product count inside `_count.products`.
 * The API exposes it as `productCount` to keep the response
 * simple and avoid leaking Prisma-specific fields.
 */
function mapCategory(category: {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  _count: {
    products: number;
  };
}) {
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description,
    productCount: category._count.products,
  };
}

export const categoryService = {
  /**
   * Get all active categories.
   *
   * Categories are already sorted alphabetically by the repository.
   * We map each result into the API response format.
   */
  async listCategories() {
    const categories = await categoryRepository.findAllActive();

    return categories.map(mapCategory);
  },

  /**
   * Get a single active category by slug.
   *
   * If no active category is found, throw a not-found error.
   * The controller/error middleware is responsible for converting
   * this error into an HTTP response.
   */
  async getCategoryBySlug(slug: string) {
    const category = await categoryRepository.findActiveBySlug(slug);

    // A missing or inactive category should behave as not found.
    if (!category) {
      throw new CategoryNotFoundError(slug);
    }

    return mapCategory(category);
  },
};
