import React from 'react';
import { Filter, Sparkles, ShieldCheck, Link2 } from 'lucide-react';

export interface WorkspaceFiltersProps {
  actionableOnly: boolean;
  onToggleActionable: () => void;
  linkedWorkOnly: boolean;
  onToggleLinkedWork: () => void;
  hasEvidenceOnly: boolean;
  onToggleHasEvidence: () => void;
  className?: string;
}

export const WorkspaceFilters: React.FC<WorkspaceFiltersProps> = ({
  actionableOnly,
  onToggleActionable,
  linkedWorkOnly,
  onToggleLinkedWork,
  hasEvidenceOnly,
  onToggleHasEvidence,
  className = '',
}) => {
  return (
    <div className={`flex flex-wrap items-center gap-2 text-xs select-none ${className}`}>
      <span className="text-slate-500 flex items-center gap-1 mr-1">
        <Filter className="w-3.5 h-3.5" />
        <span className="text-[11px] uppercase tracking-wider font-mono">Filters:</span>
      </span>

      <button
        type="button"
        onClick={onToggleActionable}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
          actionableOnly
            ? 'bg-amber-950/60 border-amber-600 text-amber-300 shadow-xs'
            : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
        }`}
      >
        <Sparkles className="w-3.5 h-3.5" />
        Actionable Intent
      </button>

      <button
        type="button"
        onClick={onToggleLinkedWork}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
          linkedWorkOnly
            ? 'bg-cyan-950/60 border-cyan-600 text-cyan-300 shadow-xs'
            : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
        }`}
      >
        <Link2 className="w-3.5 h-3.5" />
        Linked to Work
      </button>

      <button
        type="button"
        onClick={onToggleHasEvidence}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
          hasEvidenceOnly
            ? 'bg-emerald-950/60 border-emerald-600 text-emerald-300 shadow-xs'
            : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
        }`}
      >
        <ShieldCheck className="w-3.5 h-3.5" />
        Verified Evidence
      </button>
    </div>
  );
};
