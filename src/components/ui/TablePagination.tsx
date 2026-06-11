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
  if (totalItems === 0 || totalPages <= 1) {
    return null;
  }

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="flex flex-col gap-3 border-t border-slate-200 bg-white px-4 py-4 md:flex-row md:items-center md:justify-between">
      <p className="text-sm text-slate-600">
        Showing <span className="font-semibold text-slate-900">{startItem}</span> to{" "}
        <span className="font-semibold text-slate-900">{endItem}</span> of{" "}
        <span className="font-semibold text-slate-900">{totalItems}</span>
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
        <span className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700">
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
