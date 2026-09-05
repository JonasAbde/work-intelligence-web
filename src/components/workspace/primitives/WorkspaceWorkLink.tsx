import React from 'react';
import { Layers, ArrowRight, X } from 'lucide-react';

export interface WorkspaceWorkLinkProps {
  workItemId: string;
  title?: string;
  status?: string;
  onNavigate?: (id: string) => void;
  onUnlink?: (id: string) => void;
  className?: string;
}

export const WorkspaceWorkLink: React.FC<WorkspaceWorkLinkProps> = ({
  workItemId,
  title,
  status,
  onNavigate,
  onUnlink,
  className = '',
}) => {
  return (
    <div
      onClick={() => onNavigate && onNavigate(workItemId)}
      className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700/80 hover:border-cyan-500/60 text-xs text-slate-200 transition-all ${onNavigate ? 'cursor-pointer hover:bg-slate-850' : ''} ${className}`}
    >
      <Layers className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
      <span className="font-mono text-cyan-300 font-semibold">{workItemId}</span>
      {title && <span className="truncate max-w-[140px] text-slate-300">{title}</span>}
      {status && (
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
          {status}
        </span>
      )}
      {onNavigate && <ArrowRight className="w-3 h-3 text-slate-500 shrink-0" />}
      {onUnlink && (
        <button
          type="button"
          onClick={e => {
            e.stopPropagation();
            onUnlink(workItemId);
          }}
          className="text-slate-500 hover:text-rose-400 p-0.5 rounded cursor-pointer"
          title="Unlink Work Item"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  );
};
