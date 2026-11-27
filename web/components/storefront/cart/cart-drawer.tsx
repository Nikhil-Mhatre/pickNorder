"use client";

import { ShoppingBag, Minus, Plus, Trash2 } from "lucide-react";
import type { CartLine } from "@/store/cart-store";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { useRouter } from "next/navigation";
import { formatPrice } from "@/lib/format";

interface CartDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: CartLine[];
  setQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  itemCount: number;
  subtotal: number;
}

export function CartDrawer({
  open,
  items,
  onOpenChange,
  setQuantity,
  removeItem,
  itemCount,
  subtotal,
}: CartDrawerProps) {
  const router = useRouter();
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 sm:max-w-md">
        <SheetHeader className="space-y-1.5 text-left">
          <SheetTitle className="flex items-center gap-2">
            <ShoppingBag className="size-5" />
            Your Cart
            {itemCount > 0 && (
              <span className="text-sm font-normal text-muted-foreground">
                ({itemCount} {itemCount === 1 ? "item" : "items"})
              </span>
            )}
          </SheetTitle>

          <SheetDescription>Review the items you have added.</SheetDescription>
        </SheetHeader>

        <Separator className="my-5" />

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <div className="mb-4 rounded-full bg-muted p-5">
              <ShoppingBag className="size-8 text-muted-foreground" />
            </div>

            <h3 className="font-semibold">Your cart is empty</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Looks like you haven't added anything yet.
            </p>

            <Button className="mt-6" onClick={() => onOpenChange(false)}>
              Continue shopping
            </Button>
          </div>
        ) : (
          <>
            <div className="flex-1 space-y-5 overflow-y-auto p-4">
              {items.map(({ product, quantity }) => (
                <div key={product.id} className="flex gap-4">
                  <div className="relative size-20 shrink-0 overflow-hidden rounded-lg bg-muted">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="size-full object-cover"
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center">
                        <ShoppingBag className="size-6 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="line-clamp-2 text-sm font-medium">{product.name}</h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {formatPrice(product.price)}
                        </p>
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 shrink-0 text-muted-foreground hover:text-destructive"
                        aria-label={`Remove ${product.name} from cart`}
                        onClick={() => removeItem(product.id)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center rounded-md border">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 rounded-none"
                          aria-label={`Decrease quantity of ${product.name}`}
                          disabled={quantity <= 1}
                          onClick={() => setQuantity(product.id, quantity - 1)}
                        >
                          <Minus className="size-3.5" />
                        </Button>

                        <span className="min-w-8 text-center text-sm tabular-nums">{quantity}</span>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 rounded-none"
                          aria-label={`Increase quantity of ${product.name}`}
                          onClick={() => setQuantity(product.id, quantity + 1)}
                        >
                          <Plus className="size-3.5" />
                        </Button>
                      </div>

                      <span className="text-sm font-medium tabular-nums">
                        {formatPrice(product.price * quantity)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 space-y-4 border-t px-4 py-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Subtotal ({itemCount} items)</span>
                <span className="font-semibold tabular-nums">{formatPrice(subtotal)}</span>
              </div>

              <p className="text-xs text-muted-foreground">
                Shipping and taxes, if applicable, will be calculated at checkout.
              </p>

              <Button
                className="w-full"
                size="lg"
                onClick={() => {
                  (onOpenChange(false), router.push("/cart"));
                }}
              >
                View Cart
              </Button>

              <Button variant="outline" className="w-full" onClick={() => onOpenChange(false)}>
                Continue shopping
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
