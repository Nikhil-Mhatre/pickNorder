import type { Prisma } from '@prisma/client';
import type { ProductListQuery } from './product.types.js';

import { prisma } from '../../shared/infra/database/prisma.js';

// ---------------------------------------------
// Product Repository
// ---------------------------------------------

export const productRepository = {
  // -------------------------------------------
  // Get products with filters and pagination
  // -------------------------------------------

  async findMany(query: ProductListQuery) {
    const { page, limit, category, search, sortBy, sortOrder } = query;

    // Build database filters.
    const where: Prisma.ProductWhereInput = {
      isActive: true,

      // Filter products by category slug.
      ...(category && {
        category: {
          slug: category,
          isActive: true,
        },
      }),

      // Search product names (case-insensitive).
      ...(search && {
        name: {
          contains: search,
          mode: 'insensitive',
        },
      }),
    };

    // Calculate how many records to skip for pagination.
    const skip = (page - 1) * limit;

    // Fetch products and total count in one transaction.
    const [products, totalItems] = await prisma.$transaction([
      prisma.product.findMany({
        where,
        skip,
        take: limit,

        // Apply sorting from validated query parameters.
        orderBy: {
          [sortBy]: sortOrder,
        },

        // Include category details for API response mapping.
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      }),

      // Count matching products without pagination.
      prisma.product.count({ where }),
    ]);

    return {
      products,
      totalItems,
    };
  },

  // -------------------------------------------
  // Find an active product by ID
  // -------------------------------------------

  async findActiveById(id: string) {
    return prisma.product.findFirst({
      where: {
        id,
        isActive: true,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });
  },

  // -------------------------------------------
  // Find any product by ID
  // -------------------------------------------

  async findById(id: string) {
    return prisma.product.findUnique({
      where: { id },
    });
  },

  // -------------------------------------------
  // Adjust product stock
  // -------------------------------------------

  async adjustStock(id: string, operation: 'INCREASE' | 'DECREASE', quantity: number) {
    // Increase stock by the requested quantity.
    if (operation === 'INCREASE') {
      return prisma.product.updateMany({
        where: { id },
        data: {
          stock: {
            increment: quantity,
          },
        },
      });
    }

    // Decrease stock only if enough inventory exists.
    // This prevents stock from becoming negative.
    return prisma.product.updateMany({
      where: {
        id,
        stock: {
          gte: quantity,
        },
      },
      data: {
        stock: {
          decrement: quantity,
        },
      },
    });
  },
};
