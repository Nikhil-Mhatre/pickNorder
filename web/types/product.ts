export type Product = {
  id: string;
  name: string;
  description: string | null;
  price: string;
  category: string;
  imageUrl: string | null;
  stock: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Pagination = {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
};

export type ProductListResponse = {
  success: boolean;
  data: Product[];
  pagination: Pagination;
};

export type ProductResponse = ProductListResponse;
