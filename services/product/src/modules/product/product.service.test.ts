import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Prisma } from '@prisma/client';

vi.mock('./product.repository.js', () => ({
  productRepository: {
    findMany: vi.fn(),
    findActiveById: vi.fn(),
    findById: vi.fn(),
    adjustStock: vi.fn(),
  },
}));

import { productRepository } from './product.repository.js';
import { productService } from './product.service.js';

import { ProductNotFoundError } from '../../shared/errors/product-not-found.error.js';
import { InsufficientStockError } from '../../shared/errors/insufficient-stock.error.js';

// ---------------------------------------------
// Test Fixtures
// ---------------------------------------------

const mockedRepository = vi.mocked(productRepository);

const sampleCategory = {
  id: 'cat-123',
  name: 'Electronics',
  slug: 'electronics',
};

const sampleProduct = {
  id: 'prod-123',
  name: 'Wireless Headphones',
  description: 'Bluetooth headphones',
  price: new Prisma.Decimal('99.99'),
  categoryId: sampleCategory.id,
  category: sampleCategory,
  imageUrl: null,
  stock: 10,
  isActive: true,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

// ---------------------------------------------
// Product Service Tests
// ---------------------------------------------

describe('productService', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  // -------------------------------------------
  // LIST PRODUCTS
  // -------------------------------------------

  describe('listProducts', () => {
    it('should return products with pagination metadata', async () => {
      mockedRepository.findMany.mockResolvedValue({
        products: [sampleProduct],
        totalItems: 25,
      });

      const result = await productService.listProducts({
        page: 2,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });

      expect(result.products).toHaveLength(1);
      expect(result.products).toEqual([sampleProduct]);

      expect(result.pagination).toEqual({
        page: 2,
        limit: 10,
        totalItems: 25,
        totalPages: 3,
      });

      expect(mockedRepository.findMany).toHaveBeenCalledOnce();
    });

    it('should return an empty list when no products exist', async () => {
      mockedRepository.findMany.mockResolvedValue({
        products: [],
        totalItems: 0,
      });

      const result = await productService.listProducts({
        page: 1,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });

      expect(result.products).toEqual([]);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 10,
        totalItems: 0,
        totalPages: 0,
      });
    });

    it('should calculate total pages correctly', async () => {
      mockedRepository.findMany.mockResolvedValue({
        products: [sampleProduct],
        totalItems: 21,
      });

      const result = await productService.listProducts({
        page: 1,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });

      expect(result.pagination.totalPages).toBe(3);
    });
  });

  // ---------------------------------------------
  // GET PRODUCT BY ID
  // ---------------------------------------------

  describe('getProductById', () => {
    it('should return an active product', async () => {
      mockedRepository.findActiveById.mockResolvedValue(sampleProduct);

      const result = await productService.getProductById('prod-123');

      expect(result).toEqual(sampleProduct);
      expect(mockedRepository.findActiveById).toHaveBeenCalledWith('prod-123');
      expect(mockedRepository.findActiveById).toHaveBeenCalledOnce();
    });

    it('should throw ProductNotFoundError when product does not exist', async () => {
      mockedRepository.findActiveById.mockResolvedValue(null);

      await expect(productService.getProductById('invalid-id')).rejects.toThrow(
        ProductNotFoundError,
      );
    });
  });

  // ---------------------------------------------
  // PRODUCT AVAILABILITY
  // ---------------------------------------------

  describe('checkAvailability', () => {
    it('should return available when stock is greater than zero', async () => {
      mockedRepository.findActiveById.mockResolvedValue({
        ...sampleProduct,
        stock: 5,
      });

      const result = await productService.checkAvailability('prod-123');

      expect(result).toEqual({
        productId: 'prod-123',
        available: true,
        stock: 5,
      });
    });

    it('should return unavailable when stock is zero', async () => {
      mockedRepository.findActiveById.mockResolvedValue({
        ...sampleProduct,
        stock: 0,
      });

      const result = await productService.checkAvailability('prod-123');

      expect(result).toEqual({
        productId: 'prod-123',
        available: false,
        stock: 0,
      });
    });

    it('should throw ProductNotFoundError when product does not exist', async () => {
      mockedRepository.findActiveById.mockResolvedValue(null);

      await expect(productService.checkAvailability('invalid-id')).rejects.toThrow(
        ProductNotFoundError,
      );
    });
  });

  // ---------------------------------------------
  // STOCK ADJUSTMENT
  // ---------------------------------------------

  describe('adjustStock', () => {
    it('should increase product stock', async () => {
      mockedRepository.findById.mockResolvedValueOnce(sampleProduct).mockResolvedValueOnce({
        ...sampleProduct,
        stock: 15,
      });

      mockedRepository.adjustStock.mockResolvedValue({ count: 1 });

      const result = await productService.adjustStock('prod-123', {
        operation: 'INCREASE',
        quantity: 5,
      });

      expect(mockedRepository.adjustStock).toHaveBeenCalledWith('prod-123', 'INCREASE', 5);

      expect(result.stock).toBe(15);
    });

    it('should decrease product stock', async () => {
      mockedRepository.findById.mockResolvedValueOnce(sampleProduct).mockResolvedValueOnce({
        ...sampleProduct,
        stock: 7,
      });

      mockedRepository.adjustStock.mockResolvedValue({ count: 1 });

      const result = await productService.adjustStock('prod-123', {
        operation: 'DECREASE',
        quantity: 3,
      });

      expect(mockedRepository.adjustStock).toHaveBeenCalledWith('prod-123', 'DECREASE', 3);

      expect(result.stock).toBe(7);
    });

    it('should throw InsufficientStockError when stock is insufficient', async () => {
      mockedRepository.findById.mockResolvedValue({
        ...sampleProduct,
        stock: 2,
      });

      await expect(
        productService.adjustStock('prod-123', {
          operation: 'DECREASE',
          quantity: 5,
        }),
      ).rejects.toThrow(InsufficientStockError);

      expect(mockedRepository.adjustStock).not.toHaveBeenCalled();
    });

    it('should throw ProductNotFoundError when product does not exist', async () => {
      mockedRepository.findById.mockResolvedValue(null);

      await expect(
        productService.adjustStock('invalid-id', {
          operation: 'INCREASE',
          quantity: 5,
        }),
      ).rejects.toThrow(ProductNotFoundError);

      expect(mockedRepository.adjustStock).not.toHaveBeenCalled();
    });
  });
});
