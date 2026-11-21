import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Pagination } from "@/types/product";

export function CatalogPagination({ pagination, onPageChange }: { pagination: Pagination; onPageChange: (page: number) => void }) {
  if (pagination.totalPages <= 1) return null;
  return (
    <div className="mt-8 flex items-center justify-between border-t pt-5">
      <p className="text-sm text-muted-foreground">Page {pagination.page} of {pagination.totalPages}</p>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" disabled={pagination.page <= 1} onClick={() => onPageChange(pagination.page - 1)}>
          <ChevronLeft className="mr-1 size-4" /> Previous
        </Button>
        <Button variant="outline" size="sm" disabled={pagination.page >= pagination.totalPages} onClick={() => onPageChange(pagination.page + 1)}>
          Next <ChevronRight className="ml-1 size-4" />
        </Button>
      </div>
    </div>
  );
}
