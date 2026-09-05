import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface WorkspacePaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export const WorkspacePagination: React.FC<WorkspacePaginationProps> = ({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  className = '',
}) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(totalItems, currentPage * pageSize);

  if (totalItems <= pageSize) {
    return (
      <div className={`flex items-center justify-between text-xs text-slate-400 py-2 ${className}`}>
        <span>Showing all {totalItems} items</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-between text-xs text-slate-400 py-2 select-none ${className}`}>
      <span>
        Showing <strong className="text-slate-200">{startItem}–{endItem}</strong> of <strong className="text-slate-200">{totalItems}</strong>
      </span>

      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
          title="Previous page"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <span className="font-mono text-xs px-2 text-slate-300">
          Page {currentPage} / {totalPages}
        </span>

        <button
          type="button"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
          title="Next page"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
