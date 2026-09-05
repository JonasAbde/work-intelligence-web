import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { WorkspaceProvider } from '../../../runtime/workspaceResource';

export interface WorkspaceSearchProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  totalResults?: number;
  activeProvider?: WorkspaceProvider | 'all';
  onProviderChange?: (p: WorkspaceProvider | 'all') => void;
  showProviderFilters?: boolean;
  className?: string;
}

export const WorkspaceSearch: React.FC<WorkspaceSearchProps> = ({
  value,
  onChange,
  placeholder = 'Search across Gmail, Drive, Docs, Sheets, Calendar, Keep...',
  totalResults,
  activeProvider = 'all',
  onProviderChange,
  showProviderFilters = true,
  className = '',
}) => {
  const [internalVal, setInternalVal] = useState(value);

  useEffect(() => {
    setInternalVal(value);
  }, [value]);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInternalVal(val);
    onChange(val);
  };

  const providers: Array<{ id: WorkspaceProvider | 'all'; label: string }> = [
    { id: 'all', label: 'All Services' },
    { id: 'gmail', label: 'Gmail' },
    { id: 'drive', label: 'Drive' },
    { id: 'docs', label: 'Docs' },
    { id: 'sheets', label: 'Sheets' },
    { id: 'calendar', label: 'Calendar' },
    { id: 'keep', label: 'Keep' },
  ];

  return (
    <div className={`space-y-2.5 ${className}`}>
      <div className="relative flex items-center">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
        <input
          type="text"
          value={internalVal}
          onChange={handleTextChange}
          placeholder={placeholder}
          className="w-full pl-9 pr-24 py-2 rounded-xl bg-[#0b101c] border border-slate-800 focus:border-cyan-500/80 focus:ring-1 focus:ring-cyan-500/80 text-xs text-slate-100 placeholder:text-slate-500 transition-all outline-hidden"
        />

        <div className="absolute right-2.5 flex items-center gap-2">
          {totalResults !== undefined && (
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
              {totalResults} items
            </span>
          )}
          {internalVal && (
            <button
              type="button"
              onClick={() => {
                setInternalVal('');
                onChange('');
              }}
              className="p-1 rounded text-slate-400 hover:text-slate-200 cursor-pointer"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {showProviderFilters && onProviderChange && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {providers.map(p => {
            const isActive = activeProvider === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => onProviderChange(p.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer border ${
                  isActive
                    ? 'bg-cyan-950/80 border-cyan-500/60 text-cyan-300 shadow-xs'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
