import { ValidationError } from '../../shared/errors/validation-error.js';

export interface ProductListInput {
  page: number;
  limit: number;
  category?: string;
  search?: string;
  sortBy: 'name' | 'price' | 'createdAt';
  sortOrder: 'asc' | 'desc';
}

export function parseProductListInput(query: Record<string, unknown>): ProductListInput {
  const page = Number(query.page ?? 1);
  const limit = Number(query.limit ?? 10);
  const sortBy = String(query.sortBy ?? 'createdAt');
  const sortOrder = String(query.sortOrder ?? 'desc');
  const category = query.category === undefined ? undefined : String(query.category).trim();
  const search = query.search === undefined ? undefined : String(query.search).trim();

  if (!Number.isInteger(page) || page < 1) {
    throw new ValidationError('page must be a positive integer.');
  }
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw new ValidationError('limit must be between 1 and 100.');
  }
  if (!['name', 'price', 'createdAt'].includes(sortBy)) {
    throw new ValidationError('sortBy must be name, price, or createdAt.');
  }
  if (!['asc', 'desc'].includes(sortOrder)) {
    throw new ValidationError('sortOrder must be asc or desc.');
  }

  return {
    page,
    limit,
    category: category || undefined,
    search: search || undefined,
    sortBy: sortBy as ProductListInput['sortBy'],
    sortOrder: sortOrder as ProductListInput['sortOrder'],
  };
}
