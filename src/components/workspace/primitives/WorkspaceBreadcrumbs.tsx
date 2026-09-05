import React from 'react';
import { ChevronRight, HardDrive, Folder } from 'lucide-react';
import { WorkspaceProvider } from '../../../runtime/workspaceResource';

export interface BreadcrumbItem {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export interface WorkspaceBreadcrumbsProps {
  provider: WorkspaceProvider;
  items: BreadcrumbItem[];
  onSelect?: (item: BreadcrumbItem) => void;
  className?: string;
}

export const WorkspaceBreadcrumbs: React.FC<WorkspaceBreadcrumbsProps> = ({
  provider,
  items,
  onSelect,
  className = '',
}) => {
  return (
    <nav className={`flex items-center gap-1.5 text-xs text-slate-400 overflow-x-auto py-1 ${className}`} aria-label="Breadcrumbs">
      <div className="flex items-center gap-1 text-slate-300 font-medium shrink-0">
        <HardDrive className="w-3.5 h-3.5 text-slate-400" />
        <span className="capitalize">{provider}</span>
      </div>

      {items.map((item, idx) => {
        const isLast = idx === items.length - 1;
        const Icon = item.icon || Folder;

        return (
          <React.Fragment key={item.id}>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
            {isLast ? (
              <span className="font-semibold text-cyan-300 flex items-center gap-1 truncate max-w-[200px]">
                <Icon className="w-3 h-3 text-cyan-400 shrink-0" />
                <span className="truncate">{item.label}</span>
              </span>
            ) : (
              <button
                type="button"
                onClick={() => onSelect && onSelect(item)}
                className="hover:text-slate-200 transition-colors flex items-center gap-1 truncate max-w-[160px] cursor-pointer"
              >
                <Icon className="w-3 h-3 text-slate-400 shrink-0" />
                <span className="truncate">{item.label}</span>
              </button>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};
