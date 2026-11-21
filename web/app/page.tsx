"use client";

import { Store, ShoppingBag } from "lucide-react";
import { StoreHeader } from "@/components/storefront/store-header";
import { CatalogToolbar } from "@/components/storefront/catalog-toolbar";
import { ProductGrid } from "@/components/storefront/product-grid";
import { ProductGridSkeleton } from "@/components/storefront/product-grid-skeleton";
import { CatalogPagination } from "@/components/storefront/catalog-pagination";
import { CatalogEmpty, CatalogError } from "@/components/storefront/catalog-states";
import { useProducts } from "@/hooks/use-products";
import { useCartStore } from "@/store/cart-store";

export default function HomePage() {
  const catalog = useProducts();
  const cartCount = useCartStore((state) =>
    state.items.reduce((count, item) => count + item.quantity, 0),
  );
  const addItem = useCartStore((state) => state.addItem);

  return (
    <div className="min-h-screen bg-background">
      <StoreHeader
        searchInput={catalog.searchInput}
        onSearchChange={catalog.setSearchInput}
        cartCount={cartCount}
      />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="mb-8 space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Store className="size-4" /> Your shopping destination
          </div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Discover products</h1>
          <p className="max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
            Find the things you need. Explore our collection and discover something worth adding to
            your cart.
          </p>
        </section>

        <CatalogToolbar
          totalItems={catalog.pagination.totalItems}
          category={catalog.category}
          categories={catalog.categories}
          onCategoryChange={catalog.setCategory}
          currentSort={catalog.currentSort}
          onSortChange={catalog.changeSort}
          search={catalog.search}
          onClearSearch={() => catalog.setSearchInput("")}
          onClearFilters={catalog.clearFilters}
        />

        {catalog.error && (
          <CatalogError message={catalog.error} onRetry={() => window.location.reload()} />
        )}
        {catalog.loading && <ProductGridSkeleton />}
        {!catalog.loading && !catalog.error && catalog.products.length > 0 && (
          <>
            <ProductGrid products={catalog.products} onAddToCart={addItem} />
            <CatalogPagination pagination={catalog.pagination} onPageChange={catalog.goToPage} />
          </>
        )}
        {!catalog.loading && !catalog.error && catalog.products.length === 0 && (
          <CatalogEmpty onClear={catalog.clearFilters} />
        )}
      </main>

      <footer className="mt-12 border-t">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-6 text-sm text-muted-foreground sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 font-medium text-foreground">
            <ShoppingBag className="size-4" /> pickNorder
          </div>
          <p>Discover products. Shop simply.</p>
          <p className="text-xs">© 2026 pickNorder. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
