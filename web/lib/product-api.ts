import type { ProductResponse } from "@/types/product";

const API_URL = process.env.NEXT_PUBLIC_PRODUCT_SERVICE_URL;

export async function getProducts(params: Record<string, string>, signal?: AbortSignal): Promise<ProductResponse> {
  if (!API_URL) throw new Error("Product Service URL is not configured.");
  const url = new URL(API_URL);
  Object.entries(params).forEach(([key, value]) => {
    if (value) url.searchParams.set(key, value);
  });
  const response = await fetch(url.toString(), { signal });
  const result = await response.json();
  if (!response.ok || !result.success) throw new Error(result.error?.message ?? "Unable to load products.");
  return result as ProductResponse;
}
