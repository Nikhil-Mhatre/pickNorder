import axios from "axios";
import type { ProductResponse, Category } from "@/types/product";

// Store the service root URL (without /api/products or /api/categories).
const API_URL = process.env.NEXT_PUBLIC_PRODUCT_SERVICE_URL;

const productApi = axios.create({
  baseURL: API_URL,
  timeout: 10_000,
});

// API response envelope used by the Category endpoints.
interface ApiResponse<T> {
  success: boolean;
  data: T;
}

// Fetch paginated products from the Product Service.
export async function getProducts(
  params: Record<string, string>,
  signal?: AbortSignal,
): Promise<ProductResponse> {
  if (!API_URL) {
    throw new Error("Product Service URL is not configured.");
  }

  try {
    const response = await productApi.get<ProductResponse>("/api/products", {
      params,
      signal,
    });
    return response.data;
  } catch (error) {
    throw getApiErrorMessage(error, "Unable to load products.");
  }
}

// Fetch the active categories independently of the current product page/filter.
export async function getCategories(signal?: AbortSignal): Promise<Category[]> {
  if (!API_URL) {
    throw new Error("Product Service URL is not configured.");
  }

  try {
    const response = await productApi.get<ApiResponse<Category[]>>("/api/categories", {
      signal,
    });
    return response.data.data;
  } catch (error) {
    throw getApiErrorMessage(error, "Unable to load categories.");
  }
}

// Convert Axios/network errors into a readable message while preserving
// non-Axios errors we intentionally throw above.
function getApiErrorMessage(error: unknown, fallback: string): Error {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.error?.message ?? error.message ?? fallback;
    return new Error(message);
  }

  if (error instanceof Error) {
    return error;
  }

  return new Error(fallback);
}
