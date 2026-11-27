"use client";

import { useEffect, useState } from "react";
import { Header } from "./header";
import { CartDrawer } from "@/components/storefront/cart/cart-drawer";
import { useCartStore } from "@/store/cart-store";
import { Footer } from "./footer";

interface StorefrontShellProps {
  children: React.ReactNode;
}

export function StorefrontShell({ children }: StorefrontShellProps) {
  const [cartOpen, setCartOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const isCartOpen = useCartStore((state) => state.isCartOpen);
  const closeCart = useCartStore((state) => state.closeCart);
  const items = useCartStore((state) => state.items);
  const setQuantity = useCartStore((state) => state.setQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const itemCount = useCartStore((state) => state.itemCount());
  const subtotal = useCartStore((state) => state.subtotal());

  useEffect(() => {
    useCartStore.persist.rehydrate();
  }, []);

  useEffect(() => {
    setHydrated(true);
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      <Header cartCount={hydrated ? itemCount : 0} />

      <CartDrawer
        itemCount={hydrated ? itemCount : 0}
        subtotal={hydrated ? subtotal : 0}
        open={isCartOpen}
        onOpenChange={closeCart}
        items={hydrated ? items : []}
        setQuantity={setQuantity}
        removeItem={removeItem}
      />

      <div className="flex-1">{children}</div>

      <Footer />
    </div>
  );
}
