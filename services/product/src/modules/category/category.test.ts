import { beforeEach, describe, expect, it, vi } from 'vitest';

// ---------------------------------------------
// Mock Category Repository
// ---------------------------------------------
// The service tests should not connect to a real database.
// We mock the repository so we can control its responses.
//
// This allows us to test the service independently:
// - Does it map the category correctly?
// - Does it handle an empty result?
// - Does it throw when a category is not found?
// ---------------------------------------------

vi.mock('./category.repository.js', () => ({
  categoryRepository: {
    findAllActive: vi.fn(),
    findActiveBySlug: vi.fn(),
  },
}));

import { categoryRepository } from './category.repository.js';
import { categoryService } from './category.service.js';
import { CategoryNotFoundError } from '../../shared/errors/category-not-found.error.js';

// ---------------------------------------------
// Test Fixtures
// ---------------------------------------------
// Sample data used across tests.
// Fixed values make test results predictable.
// ---------------------------------------------

const mockedRepository = vi.mocked(categoryRepository);

const electronicsCategory = {
  id: 'cat-001',
  name: 'Electronics',
  slug: 'electronics',
  description: 'Electronic gadgets and devices',
  _count: {
    products: 8,
  },
};

const fashionCategory = {
  id: 'cat-002',
  name: 'Fashion',
  slug: 'fashion',
  description: 'Clothing and fashion accessories',
  _count: {
    products: 12,
  },
};

// ---------------------------------------------
// Category Service Tests
// ---------------------------------------------

describe('categoryService', () => {
  // Reset mock call history and implementations
  // before each test to prevent test interference.
  beforeEach(() => {
    vi.resetAllMocks();
  });

  // ---------------------------------------------
  // LIST CATEGORIES
  // ---------------------------------------------

  describe('listCategories', () => {
    it('should return categories with mapped product counts', async () => {
      mockedRepository.findAllActive.mockResolvedValue([
        electronicsCategory,
        fashionCategory,
      ] as never);

      const result = await categoryService.listCategories();

      // Verify category data is returned.
      expect(result).toHaveLength(2);

      // Verify Prisma's _count field is mapped to productCount.
      expect(result).toEqual([
        {
          id: 'cat-001',
          name: 'Electronics',
          slug: 'electronics',
          description: 'Electronic gadgets and devices',
          productCount: 8,
        },
        {
          id: 'cat-002',
          name: 'Fashion',
          slug: 'fashion',
          description: 'Clothing and fashion accessories',
          productCount: 12,
        },
      ]);

      // The service should call the repository only once.
      expect(mockedRepository.findAllActive).toHaveBeenCalledOnce();
    });

    it('should return an empty array when no active categories exist', async () => {
      mockedRepository.findAllActive.mockResolvedValue([]);

      const result = await categoryService.listCategories();

      expect(result).toEqual([]);
      expect(mockedRepository.findAllActive).toHaveBeenCalledOnce();
    });

    it('should return zero product count for an empty category', async () => {
      mockedRepository.findAllActive.mockResolvedValue([
        {
          ...electronicsCategory,
          _count: {
            products: 0,
          },
        },
      ] as never);

      const result = await categoryService.listCategories();

      expect(result[0].productCount).toBe(0);
    });

    it('should propagate repository errors', async () => {
      const databaseError = new Error('Database connection failed');

      mockedRepository.findAllActive.mockRejectedValue(databaseError);

      await expect(categoryService.listCategories()).rejects.toThrow('Database connection failed');
    });
  });

  // ---------------------------------------------
  // GET CATEGORY BY SLUG
  // ---------------------------------------------

  describe('getCategoryBySlug', () => {
    it('should return a category when the slug exists', async () => {
      mockedRepository.findActiveBySlug.mockResolvedValue(electronicsCategory as never);

      const result = await categoryService.getCategoryBySlug('electronics');

      expect(result).toEqual({
        id: 'cat-001',
        name: 'Electronics',
        slug: 'electronics',
        description: 'Electronic gadgets and devices',
        productCount: 8,
      });

      // Verify the correct slug was passed to the repository.
      expect(mockedRepository.findActiveBySlug).toHaveBeenCalledWith('electronics');

      expect(mockedRepository.findActiveBySlug).toHaveBeenCalledOnce();
    });

    it('should throw CategoryNotFoundError when category does not exist', async () => {
      mockedRepository.findActiveBySlug.mockResolvedValue(null);

      await expect(categoryService.getCategoryBySlug('unknown-category')).rejects.toThrow(
        CategoryNotFoundError,
      );

      expect(mockedRepository.findActiveBySlug).toHaveBeenCalledWith('unknown-category');
    });

    it('should throw CategoryNotFoundError when category is inactive', async () => {
      // The repository only returns active categories.
      // An inactive category should therefore behave as not found.
      mockedRepository.findActiveBySlug.mockResolvedValue(null);

      await expect(categoryService.getCategoryBySlug('inactive-category')).rejects.toThrow(
        CategoryNotFoundError,
      );
    });

    it('should propagate repository errors', async () => {
      const databaseError = new Error('Database connection failed');

      mockedRepository.findActiveBySlug.mockRejectedValue(databaseError);

      await expect(categoryService.getCategoryBySlug('electronics')).rejects.toThrow(
        'Database connection failed',
      );
    });
  });
});
