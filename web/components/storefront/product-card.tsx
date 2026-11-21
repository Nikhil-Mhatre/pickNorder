import Link from "next/link";
import { Package, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/types/product";
import Image from "next/image";

interface ProductCardProps {
  product: Product;
  imagePriority?: boolean;
  onAddToCart: (product: Product) => void;
}

export function ProductCard({ product, imagePriority = false, onAddToCart }: ProductCardProps) {
  return (
    <Card className="group overflow-hidden border transition-all duration-200 hover:border-primary/30 hover:shadow-sm">
      <Link
        href={`/products/${product.id}`}
        className="relative block aspect-square overflow-hidden bg-muted/40"
      >
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            loading="eager"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            priority={imagePriority}
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-muted-foreground">
            <Package className="size-12 opacity-40" />
          </div>
        )}
        {product.stock <= 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-[1px]">
            <Badge variant="secondary">Out of stock</Badge>
          </div>
        )}
      </Link>

      <CardContent className="space-y-3 p-3 sm:p-4">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">{product.category}</p>
          <Link
            href={`/products/${product.id}`}
            className="line-clamp-2 text-sm font-medium leading-5 hover:text-primary"
          >
            {product.name}
          </Link>
          <p className="text-base font-semibold tracking-tight">{formatPrice(product.price)}</p>
        </div>
        {product.stock > 0 ? (
          <p className="text-xs text-muted-foreground">
            {product.stock <= 5 ? `Only ${product.stock} left` : "In stock"}
          </p>
        ) : (
          <p className="text-xs text-destructive">Out of stock</p>
        )}
        <Button
          className="w-full"
          size="sm"
          disabled={product.stock <= 0}
          onClick={() => onAddToCart(product)}
        >
          <ShoppingCart className="mr-2 size-4" /> Add to cart
        </Button>
      </CardContent>
    </Card>
  );
}
