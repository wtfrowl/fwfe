import { Button } from "./Button";

interface TablePaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export function TablePagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
}: TablePaginationProps) {
  if (totalItems === 0 || totalPages <= 1) return null;

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="flex flex-col gap-3 border-t border-hairline bg-canvas-sunken/50 px-4 py-3.5 md:flex-row md:items-center md:justify-between">
      <p className="text-sm text-ink-secondary">
        Showing <span className="font-semibold text-ink">{startItem}</span>–
        <span className="font-semibold text-ink">{endItem}</span> of{" "}
        <span className="font-semibold text-ink">{totalItems}</span>
      </p>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="secondary"
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
        >
          Previous
        </Button>
        <span className="rounded-control bg-ink/6 px-3 py-1.5 text-sm font-medium tabular-nums text-ink-secondary">
          {currentPage} / {totalPages}
        </span>
        <Button
          size="sm"
          variant="secondary"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
