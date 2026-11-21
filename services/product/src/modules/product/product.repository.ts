import type { Prisma } from '@prisma/client';
import type { ProductListQuery } from './product.validator.js';
import { prisma } from '../../shared/infra/database/prisma.js';

export const productRepository = {
  async findMany(query: ProductListQuery) {
    const { page, limit, category, search, sortBy, sortOrder } = query;

    const where: Prisma.ProductWhereInput = {
      isActive: true,
      ...(category && { category }),
      ...(search && {
        name: {
          contains: search,
          mode: 'insensitive',
        },
      }),
    };

    const [products, totalItems] = await prisma.$transaction([
      prisma.product.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: {
          [sortBy]: sortOrder,
        },
      }),
      prisma.product.count({ where }),
    ]);

    return { products, totalItems };
  },

  async findActiveById(id: string) {
    return prisma.product.findFirst({
      where: {
        id,
        isActive: true,
      },
    });
  },

  async findById(id: string) {
    return prisma.product.findUnique({
      where: { id },
    });
  },

  async adjustStock(id: string, operation: 'INCREASE' | 'DECREASE', quantity: number) {
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

    // Atomic conditional decrement.
    // The database itself prevents stock from becoming negative.
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
