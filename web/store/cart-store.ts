import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { Product } from "@/types/product";

// Each cart line stores a product snapshot and the quantity selected by the user.
export interface CartLine {
  product: Product;
  quantity: number;
}

interface CartState {
  items: CartLine[];

  // Cart actions
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  setQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;

  // Derived value. Call it when you need the total quantity across all lines.
  itemCount: () => number;
}

// Keep updates in named helpers so each state transition is easy to inspect.
function incrementExistingLine(items: CartLine[], productId: string): CartLine[] {
  return items.map((line) =>
    line.product.id === productId ? { ...line, quantity: line.quantity + 1 } : line,
  );
}

function removeLine(items: CartLine[], productId: string): CartLine[] {
  return items.filter((line) => line.product.id !== productId);
}

function updateLineQuantity(items: CartLine[], productId: string, quantity: number): CartLine[] {
  // A non-positive quantity means the user wants the item removed.
  if (quantity <= 0) return removeLine(items, productId);

  return items.map((line) => (line.product.id === productId ? { ...line, quantity } : line));
}

function calculateItemCount(items: CartLine[]): number {
  return items.reduce((total, line) => total + line.quantity, 0);
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product) =>
        set((state) => {
          const productAlreadyInCart = state.items.some((line) => line.product.id === product.id);

          // If the product is already present, increment its quantity instead
          // of creating a duplicate cart line.
          if (productAlreadyInCart) {
            return {
              items: incrementExistingLine(state.items, product.id),
            };
          }

          // Otherwise, add a new cart line with an initial quantity of one.
          return {
            items: [...state.items, { product, quantity: 1 }],
          };
        }),

      removeItem: (productId) =>
        set((state) => ({
          items: removeLine(state.items, productId),
        })),

      setQuantity: (productId, quantity) =>
        set((state) => ({
          items: updateLineQuantity(state.items, productId, quantity),
        })),

      clearCart: () => set({ items: [] }),

      itemCount: () => calculateItemCount(get().items),
    }),
    {
      name: "picknorder-cart",
      // Persist the cart in browser local storage so it survives page reloads.
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
