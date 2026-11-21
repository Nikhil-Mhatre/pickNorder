"use client";

import { ArrowUpDown, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// The Category API returns category objects. Use the slug for filtering and
// the name only for display.
interface CategoryOption {
  id: string;
  name: string;
  slug: string;
  productCount: number;
}

type SortOption = "newest" | "price-low" | "price-high" | "name";

interface CatalogToolbarProps {
  totalItems: number;
  category: string;
  categories: CategoryOption[];
  onCategoryChange: (slug: string) => void;
  currentSort: SortOption;
  onSortChange: (sort: SortOption) => void;
  search: string;
  onClearSearch: () => void;
  onClearFilters: () => void;
}

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "price-low", label: "Price: Low to High" },
  { value: "price-high", label: "Price: High to Low" },
  { value: "name", label: "Name: A to Z" },
];

export function CatalogToolbar({
  totalItems,
  category,
  categories,
  onCategoryChange,
  currentSort,
  onSortChange,
  search,
  onClearSearch,
  onClearFilters,
}: CatalogToolbarProps) {
  // Resolve the selected slug to its display name for the active filter chip.
  const selectedCategory = categories.find((item) => item.slug === category);
  const hasActiveFilters = Boolean(search || category);

  return (
    <div className="mb-6">
      <section
        aria-label="Product catalog controls"
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold">All products</h2>
          <Badge variant="secondary" className="font-normal tabular-nums">
            {totalItems}
          </Badge>
          <span className="sr-only" aria-live="polite">
            {totalItems} products found
          </span>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:flex sm:items-center">
          <label className="sr-only" htmlFor="catalog-category">
            Filter by category
          </label>
          <select
            id="catalog-category"
            value={category}
            onChange={(event) => onCategoryChange(event.target.value)}
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring sm:w-[190px]"
          >
            <option value="">All categories</option>
            {categories.map((item) => (
              <option key={item.id} value={item.slug}>
                {item.name}
              </option>
            ))}
          </select>

          <div className="relative">
            <ArrowUpDown
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <label className="sr-only" htmlFor="catalog-sort">
              Sort products
            </label>
            <select
              id="catalog-sort"
              value={currentSort}
              onChange={(event) => onSortChange(event.target.value as SortOption)}
              className="h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring sm:w-[190px]"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {hasActiveFilters && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {search && (
            <Badge variant="secondary" className="gap-1.5 py-1">
              <span className="max-w-[220px] truncate">Search: {search}</span>
              <button
                type="button"
                onClick={onClearSearch}
                aria-label={`Clear search: ${search}`}
                className="rounded-sm outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
              >
                <X aria-hidden="true" className="size-3" />
              </button>
            </Badge>
          )}

          {category && (
            <Badge variant="secondary" className="gap-1.5 py-1">
              {selectedCategory?.name ?? category}
              <button
                type="button"
                onClick={() => onCategoryChange("")}
                aria-label={`Remove category filter: ${selectedCategory?.name ?? category}`}
                className="rounded-sm outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
              >
                <X aria-hidden="true" className="size-3" />
              </button>
            </Badge>
          )}

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="h-7 px-2"
          >
            Clear filters
          </Button>
        </div>
      )}
    </div>
  );
}
