"use client";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { getProducts } from "@/lib/product-api";

export function useProducts() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [page, setPage] = useState(1);
  const limit = 12;

  function handleSearchInput(value: string) {
    setSearchInput(value);
    setPage(1);
  }

  function handleCategoryChange(value: string) {
    setCategory(value);
    setPage(1);
  }

  useEffect(() => {
    const timer = window.setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const params = useMemo(
    () => ({
      page: String(page),
      limit: String(limit),
      sortBy,
      sortOrder,
      ...(search ? { search } : {}),
      ...(category ? { category } : {}),
    }),
    [page, limit, sortBy, sortOrder, search, category],
  );

  const query = useQuery({
    queryKey: ["products", params],
    queryFn: ({ signal }) => getProducts(params, signal),
  });

  const products = useMemo(() => query.data?.data ?? [], [query.data?.data]);
  const pagination = query.data?.pagination ?? { page, limit, totalItems: 0, totalPages: 0 };
  const categories = useMemo(
    () => [...new Set(products.map((p) => p.category).filter(Boolean))].sort(),
    [products],
  );

  function changeSort(value: string) {
    setPage(1);

    if (value === "price-low") {
      setSortBy("price");
      setSortOrder("asc");
    } else if (value === "price-high") {
      setSortBy("price");
      setSortOrder("desc");
    } else if (value === "name") {
      setSortBy("name");
      setSortOrder("asc");
    } else {
      setSortBy("createdAt");
      setSortOrder("desc");
    }
  }

  const currentSort =
    sortBy === "price"
      ? sortOrder === "asc"
        ? "price-low"
        : "price-high"
      : sortBy === "name"
        ? "name"
        : "newest";
  function clearFilters() {
    setSearchInput("");
    setSearch("");
    setCategory("");
    setSortBy("createdAt");
    setSortOrder("desc");
    setPage(1);
  }
  function goToPage(nextPage: number) {
    setPage(nextPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return {
    products,
    pagination,
    searchInput,
    setSearchInput: handleSearchInput,
    search,
    category,
    setCategory: handleCategoryChange,
    currentSort,
    changeSort,
    clearFilters,
    goToPage,
    categories,
    loading: query.isLoading,
    error: query.error instanceof Error ? query.error.message : null,
    retry: query.refetch,
  };
}
