import React from 'react';
import { CheckSquare, Square, MinusSquare } from 'lucide-react';

export interface WorkspaceSelectionProps {
  selectedCount: number;
  totalCount: number;
  onToggleAll: () => void;
  onClear: () => void;
  className?: string;
}

export const WorkspaceSelection: React.FC<WorkspaceSelectionProps> = ({
  selectedCount,
  totalCount,
  onToggleAll,
  onClear,
  className = '',
}) => {
  const isAllSelected = totalCount > 0 && selectedCount === totalCount;
  const isIndeterminate = selectedCount > 0 && selectedCount < totalCount;

  return (
    <div className={`inline-flex items-center gap-2.5 text-xs text-slate-300 select-none ${className}`}>
      <button
        type="button"
        onClick={onToggleAll}
        className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer"
        title={isAllSelected ? 'Deselect all' : 'Select all'}
      >
        {isAllSelected ? (
          <CheckSquare className="w-4 h-4 text-cyan-400" />
        ) : isIndeterminate ? (
          <MinusSquare className="w-4 h-4 text-cyan-400" />
        ) : (
          <Square className="w-4 h-4 text-slate-500 hover:text-slate-300" />
        )}
        <span className="font-medium">
          {selectedCount > 0 ? `${selectedCount} selected` : 'Select all'}
        </span>
      </button>

      {selectedCount > 0 && (
        <button
          type="button"
          onClick={onClear}
          className="text-[11px] text-slate-400 hover:text-slate-200 underline cursor-pointer"
        >
          Clear
        </button>
      )}
    </div>
  );
};
