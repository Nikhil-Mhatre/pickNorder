"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { getCategories, getProducts } from "@/lib/api/product-api";

// ---------------------------------------------
// Types
// ---------------------------------------------

type SortOption = "newest" | "price-low" | "price-high" | "name";

// ---------------------------------------------
// Constants
// ---------------------------------------------

const PRODUCTS_PER_PAGE = 12;
const SEARCH_DEBOUNCE_MS = 300;

// Define how each UI sorting option maps to API parameters.
const SORT_CONFIG: Record<SortOption, { sortBy: string; sortOrder: string }> = {
  newest: {
    sortBy: "createdAt",
    sortOrder: "desc",
  },
  "price-low": {
    sortBy: "price",
    sortOrder: "asc",
  },
  "price-high": {
    sortBy: "price",
    sortOrder: "desc",
  },
  name: {
    sortBy: "name",
    sortOrder: "asc",
  },
};

// ---------------------------------------------
// Hook
// ---------------------------------------------

export function useProducts() {
  // Search input shown in the UI.
  const [searchInput, setSearchInput] = useState("");

  // Search value sent to the API after debounce.
  const [search, setSearch] = useState("");

  // Active category filter.
  const [category, setCategory] = useState("");

  // Active sorting option.
  const [sort, setSort] = useState<SortOption>("newest");

  // Current pagination page.
  const [page, setPage] = useState(1);

  // ---------------------------------------------
  // Search debounce
  // ---------------------------------------------

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim());
    }, SEARCH_DEBOUNCE_MS);

    // Cancel the previous timer when the input changes.
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  // ---------------------------------------------
  // API query parameters
  // ---------------------------------------------

  // Get the API sorting configuration for the selected option.
  const { sortBy, sortOrder } = SORT_CONFIG[sort];

  // Build the parameters used to request products.
  const params = {
    page: String(page),
    limit: String(PRODUCTS_PER_PAGE),
    sortBy,
    sortOrder,
    ...(search ? { search } : {}),
    ...(category ? { category } : {}),
  };

  // Product data changes with search, category, sort, or pagination.
  const productsQuery = useQuery({
    queryKey: ["products", params],
    queryFn: ({ signal }) => getProducts(params, signal),
  });

  // Categories are fetched once independently; product pagination must not affect this list.
  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: ({ signal }) => getCategories(signal),
  });

  const products = productsQuery.data?.data ?? [];
  const pagination = productsQuery.data?.pagination ?? {
    page,
    limit: PRODUCTS_PER_PAGE,
    totalItems: 0,
    totalPages: 0,
  };

  function handleSearchChange(value: string) {
    setSearchInput(value);
    setPage(1);
  }

  function handleCategoryChange(slug: string) {
    setCategory(slug);
    setPage(1);
  }

  function handleSortChange(value: SortOption) {
    setSort(value);
    setPage(1);
  }

  function clearFilters() {
    setSearchInput("");
    setSearch("");
    setCategory("");
    setSort("newest");
    setPage(1);
  }

  function goToPage(nextPage: number) {
    // Guard against invalid page values from UI controls.
    if (nextPage < 1 || (pagination.totalPages > 0 && nextPage > pagination.totalPages)) {
      return;
    }

    setPage(nextPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return {
    products,
    pagination,

    // Category records now come from the Category endpoint, not the current product page.
    categories: categoriesQuery.data ?? [],

    searchInput,
    setSearchInput: handleSearchChange,
    search,
    category,
    setCategory: handleCategoryChange,
    currentSort: sort,
    changeSort: handleSortChange,

    clearFilters,
    goToPage,

    loading: productsQuery.isLoading,
    error: productsQuery.error instanceof Error ? productsQuery.error.message : null,
    retry: productsQuery.refetch,

    categoriesLoading: categoriesQuery.isLoading,
    categoriesError: categoriesQuery.error instanceof Error ? categoriesQuery.error.message : null,
    retryCategories: categoriesQuery.refetch,
  };
}
