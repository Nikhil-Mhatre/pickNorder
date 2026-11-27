import { ShoppingBag } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-auto border-t">
      <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-6 text-sm text-muted-foreground sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 font-medium text-foreground">
          <ShoppingBag aria-hidden="true" className="size-4" />
          <span>pickNorder</span>
        </div>

        <p>Discover products. Shop simply.</p>

        <p className="text-xs">© 2026 pickNorder. All rights reserved.</p>
      </div>
    </footer>
  );
}
