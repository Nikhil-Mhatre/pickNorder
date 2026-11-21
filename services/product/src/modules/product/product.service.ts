import { InsufficientStockError } from '../../shared/errors/insufficient-stock.error.js';
import { ProductNotFoundError } from '../../shared/errors/product-not-found.error.js';
import { productRepository } from './product.repository.js';
import type { ProductListQuery, StockAdjustmentInput } from './product.types.js';

export const productService = {
  async listProducts(query: ProductListQuery) {
    const { products, totalItems } = await productRepository.findMany(query);

    return {
      products,
      pagination: {
        page: query.page,
        limit: query.limit,
        totalItems,
        totalPages: Math.ceil(totalItems / query.limit),
      },
    };
  },

  async getProductById(id: string) {
    const product = await productRepository.findActiveById(id);

    if (!product) {
      throw new ProductNotFoundError(id);
    }

    return product;
  },

  async checkAvailability(id: string) {
    const product = await productRepository.findActiveById(id);

    if (!product) {
      throw new ProductNotFoundError(id);
    }

    return {
      productId: product.id,
      available: product.stock > 0,
      stock: product.stock,
    };
  },

  async adjustStock(id: string, input: StockAdjustmentInput) {
    const existingProduct = await productRepository.findById(id);

    if (!existingProduct || !existingProduct.isActive) {
      throw new ProductNotFoundError(id);
    }

    if (input.operation === 'DECREASE' && existingProduct.stock < input.quantity) {
      throw new InsufficientStockError(id, input.quantity, existingProduct.stock);
    }

    const result = await productRepository.adjustStock(id, input.operation, input.quantity);

    // Handles concurrent changes between our initial read and update.
    if (result.count === 0) {
      const currentProduct = await productRepository.findById(id);

      if (!currentProduct || !currentProduct.isActive) {
        throw new ProductNotFoundError(id);
      }

      if (input.operation === 'DECREASE') {
        throw new InsufficientStockError(id, input.quantity, currentProduct.stock);
      }
    }

    const updatedProduct = await productRepository.findById(id);

    if (!updatedProduct) {
      throw new ProductNotFoundError(id);
    }

    return updatedProduct;
  },
};
