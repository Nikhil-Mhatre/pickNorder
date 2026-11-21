import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Product } from "@/types/product";

type CartLine = { product: Product; quantity: number };
type CartState = {
  items: CartLine[];
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  setQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  itemCount: () => number;
};


export const useCartStore = create<CartState>()(persist((set, get) => ({
  items: [],
  addItem: (product) => set((state) => {
    const existing = state.items.find((line) => line.product.id === product.id);
    if (existing) return { items: state.items.map((line) => line.product.id === product.id ? { ...line, quantity: line.quantity + 1 } : line) };
    return { items: [...state.items, { product, quantity: 1 }] };
  }),
  removeItem: (productId) => set((state) => ({ items: state.items.filter((line) => line.product.id !== productId) })),
  setQuantity: (productId, quantity) => set((state) => ({ items: quantity <= 0 ? state.items.filter((line) => line.product.id !== productId) : state.items.map((line) => line.product.id === productId ? { ...line, quantity } : line) })),
  clearCart: () => set({ items: [] }),
  itemCount: () => get().items.reduce((total, line) => total + line.quantity, 0),
}), { name: "picknorder-cart", storage: createJSONStorage(() => localStorage) }));
