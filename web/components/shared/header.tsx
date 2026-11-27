"use client";

import Link from "next/link";
import { ShoppingBag, ShoppingCart, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface StoreHeaderProps {
  cartCount?: number;
}

export function Header({ cartCount = 0 }: StoreHeaderProps) {
  const router = useRouter();
  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <ShoppingBag className="size-5" />
          </span>
          <span className="text-lg font-semibold tracking-tight">pickNorder</span>
        </Link>

        <div className="flex items-center gap-1">
          <Button
            onClick={() => router.push("/cart")}
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
        </div>
      </div>
    </header>
  );
}
