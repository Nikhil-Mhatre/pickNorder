"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

import { useCartStore } from "@/store/cart-store";
import { formatPrice } from "@/lib/format";
import { useRouter } from "next/navigation";

export default function CartPage() {
  const router = useRouter();
  const items = useCartStore((state) => state.items);
  const setQuantity = useCartStore((state) => state.setQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const clearCart = useCartStore((state) => state.clearCart);

  const subtotal = useCartStore((state) => state.subtotal());
  const itemCount = useCartStore((state) => state.itemCount());

  const shipping = 0;
  const total = subtotal + shipping;

  if (items.length === 0) {
    return (
      <main className="flex flex-1 items-center justify-center px-4 py-20">
        <div className="flex max-w-md flex-col items-center text-center">
          <div className="mb-6 flex size-20 items-center justify-center rounded-full bg-muted">
            <ShoppingBag className="size-8 text-muted-foreground" />
          </div>

          <h1 className="text-2xl font-semibold tracking-tight">Your cart is empty</h1>

          <p className="mt-2 text-sm text-muted-foreground">
            Looks like you haven't added anything to your cart yet.
          </p>

          <Button className="mt-6" onClick={() => router.push("/")}>
            <ArrowLeft className="size-4" />
            Continue shopping
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Continue shopping
          </Link>

          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Shopping Cart</h1>

              <p className="mt-1 text-muted-foreground">
                {itemCount} {itemCount === 1 ? "item" : "items"} in your cart
              </p>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={clearCart}
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="size-4" />
              Clear cart
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Cart Items */}
          <section className="space-y-4 lg:col-span-2">
            {items.map(({ product, quantity }) => (
              <Card key={product.id}>
                <CardContent className="flex gap-4 p-4 sm:gap-6">
                  {/* Product Image */}
                  <div className="relative aspect-square size-24 shrink-0 overflow-hidden rounded-md bg-muted sm:size-32">
                    {product.imageUrl ? (
                      <Image
                        src={product.imageUrl}
                        alt={product.name}
                        fill
                        sizes="(max-width: 640px) 96px, 128px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <ShoppingBag className="size-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  {/* Product Details */}
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h2 className="line-clamp-2 font-medium">{product.name}</h2>

                        <p className="mt-1 text-sm text-muted-foreground">
                          {formatPrice(Number(product.price))}
                        </p>
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Remove ${product.name}`}
                        onClick={() => removeItem(product.id)}
                        className="shrink-0 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>

                    <div className="mt-auto flex flex-wrap items-end justify-between gap-3 pt-4">
                      {/* Quantity Control */}
                      <div className="flex items-center rounded-md border">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-9 rounded-none"
                          aria-label="Decrease quantity"
                          onClick={() => setQuantity(product.id, quantity - 1)}
                        >
                          <Minus className="size-4" />
                        </Button>

                        <span className="min-w-10 text-center text-sm font-medium">{quantity}</span>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-9 rounded-none"
                          aria-label="Increase quantity"
                          onClick={() => setQuantity(product.id, quantity + 1)}
                        >
                          <Plus className="size-4" />
                        </Button>
                      </div>

                      {/* Line Total */}
                      <p className="font-semibold">
                        {formatPrice(Number(product.price) * quantity)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </section>

          {/* Order Summary */}
          <Card className="h-fit lg:sticky lg:top-24">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Order Summary
                <Badge variant="secondary">{itemCount} items</Badge>
              </CardTitle>
            </CardHeader>

            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>

                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>{shipping === 0 ? "Free" : formatPrice(shipping)}</span>
                </div>

                <Separator />

                <div className="flex justify-between gap-4 text-base font-semibold">
                  <span>Total</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>

              <Button className="mt-6 w-full" size="lg" disabled>
                Proceed to checkout
              </Button>

              <p className="mt-3 text-center text-xs text-muted-foreground">
                Checkout will be available soon.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
