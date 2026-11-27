"use client";

import Link from "next/link";
import { Search, ShoppingBag, ShoppingCart, UserRound, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface StoreHeaderProps {
  searchInput: string;
  onSearchChange: (value: string) => void;
  cartCount?: number;
  setCartDrawerOpen: (value: boolean) => void;
}

export function StoreHeader({
  searchInput,
  onSearchChange,
  cartCount = 0,
  setCartDrawerOpen,
}: StoreHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <ShoppingBag className="size-5" />
          </span>
          <span className="text-lg font-semibold tracking-tight">pickNorder</span>
        </Link>

        <div className="hidden max-w-xl flex-1 md:block">
          <SearchField value={searchInput} onChange={onSearchChange} />
        </div>

        <div className="flex items-center gap-1">
          <Button
            onClick={() => setCartDrawerOpen(true)}
            variant="ghost"
            size="icon"
            className="relative"
            aria-label="Shopping cart"
          >
            <ShoppingCart className="size-5" />
            {cartCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
                {cartCount}
              </span>
            )}
          </Button>
          <Button variant="ghost" size="icon" aria-label="Account">
            <UserRound className="size-5" />
          </Button>
        </div>
      </div>

      <div className="border-t px-4 py-3 md:hidden">
        <SearchField value={searchInput} onChange={onSearchChange} />
      </div>
    </header>
  );
}

function SearchField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search products..."
        className="h-10 bg-muted/40 pl-9"
        aria-label="Search products"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          aria-label="Clear search"
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  );
}
