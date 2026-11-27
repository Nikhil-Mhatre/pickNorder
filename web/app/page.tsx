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
import { CartDrawer } from "@/components/storefront/cart/cart-drawer";
import { useEffect, useState } from "react";
import type { Product } from "@/types/product";

export default function HomePage() {
  const catalog = useProducts();
  useEffect(() => {
    useCartStore.persist.rehydrate();
  }, []);

  // State which controlls cart drawer opening/close
  const [cartOpen, setCartOpen] = useState(false);

  const cartItems = useCartStore((state) => state.items);
  const addItem = useCartStore((state) => state.addItem);
  const setQuantity = useCartStore((state) => state.setQuantity);
  const removeItem = useCartStore((state) => state.removeItem);

  // Get Current Items in cart
  const itemCount = useCartStore((state) => state.itemCount());
  const subtotal = useCartStore((state) => state.subtotal());

  function handleAddToCart(product: Product) {
    addItem(product);
    setCartOpen(true);
  }

  return (
    <div className="min-h-screen bg-background">
      <StoreHeader
        searchInput={catalog.searchInput}
        onSearchChange={catalog.setSearchInput}
        cartCount={itemCount}
        setCartDrawerOpen={setCartOpen}
      />

      <main className="mx-auto max-w-7xl px-4 pb-12 pt-6 sm:px-6 sm:pt-10 lg:px-8">
        {/* A compact hero introduces the store without pushing the catalog too far down. */}
        <section
          aria-labelledby="storefront-heading"
          className="mb-8 rounded-2xl border bg-muted/30 px-5 py-7 sm:px-8 sm:py-9"
        >
          <div className="mb-3 flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Store aria-hidden="true" className="size-4" />
            <span>Everyday shopping, made simple</span>
          </div>

          <h1
            id="storefront-heading"
            className="text-2xl font-semibold tracking-tight sm:text-3xl lg:text-4xl"
          >
            Discover products
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
            Browse the catalog, find what you need, and add your favorites to the cart.
          </p>
        </section>

        <section aria-label="Product catalog" className="space-y-5">
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

          {/* Category errors are independent of product errors; the product list can still render. */}
          {catalog.categoriesError && (
            <div
              role="status"
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border px-4 py-3 text-sm text-muted-foreground"
            >
              <p>Categories couldn&apos;t be loaded. You can still browse all products.</p>
              <button
                type="button"
                onClick={() => catalog.retryCategories()}
                className="font-medium text-foreground underline underline-offset-4"
              >
                Retry categories
              </button>
            </div>
          )}

          {catalog.error && (
            <CatalogError message={catalog.error} onRetry={() => catalog.retry()} />
          )}

          {catalog.loading && <ProductGridSkeleton />}

          {!catalog.loading && !catalog.error && catalog.products.length > 0 && (
            <>
              <ProductGrid products={catalog.products} onAddToCart={handleAddToCart} />
              <CatalogPagination pagination={catalog.pagination} onPageChange={catalog.goToPage} />
            </>
          )}

          {!catalog.loading && !catalog.error && catalog.products.length === 0 && (
            <CatalogEmpty onClear={catalog.clearFilters} />
          )}
        </section>
        <CartDrawer
          itemCount={itemCount}
          subtotal={subtotal}
          open={cartOpen}
          onOpenChange={setCartOpen}
          items={cartItems}
          setQuantity={setQuantity}
          removeItem={removeItem}
        />
      </main>

      <footer className="border-t">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-6 text-sm text-muted-foreground sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 font-medium text-foreground">
            <ShoppingBag aria-hidden="true" className="size-4" />
            <span>pickNorder</span>
          </div>
          <p>Discover products. Shop simply.</p>
          <p className="text-xs">© 2026 pickNorder. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
