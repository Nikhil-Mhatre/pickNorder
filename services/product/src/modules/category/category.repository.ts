import { prisma } from '../../shared/infra/database/prisma.js';

// ---------------------------------------------
// Category Repository
// ---------------------------------------------
// This file contains database queries related to categories.
//
// Responsibilities:
// - Fetch active categories.
// - Fetch a category by its slug.
// - Count only active products belonging to each category.
//
// Business logic and HTTP handling should stay outside
// this file.
// ---------------------------------------------

export const categoryRepository = {
  /**
   * Fetch all active categories.
   *
   * Categories are sorted alphabetically by name to keep
   * the order consistent for the frontend.
   *
   * The product count includes only active products.
   * We use Prisma's filtered relation count instead of
   * fetching all products just to count them.
   */
  async findAllActive() {
    return prisma.category.findMany({
      // Only return categories visible to customers.
      where: {
        isActive: true,
      },

      // Keep the category list in a predictable order.
      orderBy: {
        name: 'asc',
      },

      // Return category fields and active product count.
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,

        _count: {
          select: {
            products: {
              where: {
                isActive: true,
              },
            },
          },
        },
      },
    });
  },

  /**
   * Fetch one active category using its unique slug.
   *
   * Example slug: "electronics", "home-appliances"
   *
   * Returns null when the category does not exist
   * or is inactive.
   *
   * The product count includes only active products.
   */
  async findActiveBySlug(slug: string) {
    return prisma.category.findFirst({
      where: {
        slug,
        isActive: true,
      },

      select: {
        id: true,
        name: true,
        slug: true,
        description: true,

        _count: {
          select: {
            products: {
              where: {
                isActive: true,
              },
            },
          },
        },
      },
    });
  },
};
