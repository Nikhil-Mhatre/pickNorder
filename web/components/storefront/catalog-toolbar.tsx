"use client";


import { ArrowUpDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface CatalogToolbarProps {
  totalItems: number;
  category: string;
  categories: string[];
  onCategoryChange: (value: string) => void;
  currentSort: string;
  onSortChange: (value: string) => void;
  search: string;
  onClearSearch: () => void;
  onClearFilters: () => void;
}


export function CatalogToolbar(props: CatalogToolbarProps) {
  return (
    <>
      <section className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold">All products</h2>
          <Badge variant="secondary" className="font-normal">{props.totalItems}</Badge>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <select
            value={props.category}
            onChange={(event) => props.onCategoryChange(event.target.value)}
            className="h-9 rounded-md border bg-background px-3 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Filter by category"
          >
            <option value="">All categories</option>
            {props.categories.map((category) => <option key={category} value={category}>{category}</option>)}
          </select>
          <div className="relative">
            <ArrowUpDown className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <select
              value={props.currentSort}
              onChange={(event) => props.onSortChange(event.target.value)}
              className="h-9 w-full rounded-md border bg-background pl-9 pr-3 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring sm:w-[180px]"
              aria-label="Sort products"
            >
              <option value="newest">Newest</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="name">Name: A to Z</option>
            </select>
          </div>
        </div>
      </section>


      {(props.search || props.category) && (
        <div className="mb-5 flex flex-wrap items-center gap-2">
          {props.search && (
            <Badge variant="secondary" className="gap-1.5 py-1">
              Search: {props.search}
              <button type="button" onClick={props.onClearSearch} aria-label="Remove search"><X className="size-3" /></button>
            </Badge>
          )}
          {props.category && (
            <Badge variant="secondary" className="gap-1.5 py-1">
              {props.category}
              <button type="button" onClick={() => props.onCategoryChange("")} aria-label="Remove category"><X className="size-3" /></button>
            </Badge>
          )}
          <Button variant="ghost" size="sm" onClick={props.onClearFilters}>Clear filters</Button>
        </div>
      )}
    </>
  );
}
