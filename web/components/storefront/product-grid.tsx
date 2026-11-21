import type { Product } from "@/types/product";
import { ProductCard } from "@/components/storefront/product-card";

interface ProductGridProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
}


export function ProductGrid({ products, onAddToCart }: ProductGridProps) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((product, index) => (
        <ProductCard key={product.id} product={product} imagePriority={index < 4} onAddToCart={onAddToCart} />
      ))}
    </div>
  );
}
