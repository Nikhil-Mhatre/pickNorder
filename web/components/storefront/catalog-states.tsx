import { Package, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function CatalogError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <Card className="mb-6">
      <CardContent className="flex flex-col items-center justify-center gap-3 py-12 text-center">
        <Package className="size-10 text-muted-foreground" />
        <div className="space-y-1">
          <p className="font-medium">Unable to load products</p>
          <p className="text-sm text-muted-foreground">{message}</p>
        </div>
        <Button variant="outline" onClick={onRetry}>Try again</Button>
      </CardContent>
    </Card>
  );
}


export function CatalogEmpty({ onClear }: { onClear: () => void }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center gap-4 py-16 text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-muted">
          <Search className="size-6 text-muted-foreground" />
        </div>
        <div className="space-y-1">
          <h3 className="font-semibold">No products found</h3>
          <p className="text-sm text-muted-foreground">Try another search or remove some filters.</p>
        </div>
        <Button variant="outline" onClick={onClear}>Clear filters</Button>
      </CardContent>
    </Card>
  );
}
