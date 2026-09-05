import React from 'react';
import { WorkspaceResource } from '../../../runtime/workspaceResource';
import { InHouseButton } from '../../../runtime/primitives/Actions';
import { Sparkles, ShieldCheck, Link2, Archive, Trash2, X } from 'lucide-react';

export interface WorkspaceBulkActionsProps {
  selectedResources: WorkspaceResource[];
  onBatchCreateWork?: (resources: WorkspaceResource[]) => void;
  onBatchAttachEvidence?: (resources: WorkspaceResource[]) => void;
  onBatchLinkWork?: (resources: WorkspaceResource[]) => void;
  onBatchArchive?: (resources: WorkspaceResource[]) => void;
  onBatchDelete?: (resources: WorkspaceResource[]) => void;
  onClearSelection: () => void;
  className?: string;
}

export const WorkspaceBulkActions: React.FC<WorkspaceBulkActionsProps> = ({
  selectedResources,
  onBatchCreateWork,
  onBatchAttachEvidence,
  onBatchLinkWork,
  onBatchArchive,
  onBatchDelete,
  onClearSelection,
  className = '',
}) => {
  const count = selectedResources.length;
  if (count === 0) return null;

  return (
    <div
      className={`sticky bottom-4 z-30 mx-auto max-w-2xl w-full px-4 py-2.5 rounded-xl bg-slate-900/95 border border-cyan-500/50 shadow-2xl backdrop-blur-md flex items-center justify-between gap-3 text-xs text-slate-100 ${className}`}
    >
      <div className="flex items-center gap-2">
        <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono font-semibold text-xs border border-cyan-500/40">
          {count}
        </span>
        <span className="font-medium text-slate-200">
          items selected
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {onBatchCreateWork && (
          <InHouseButton
            variant="primary"
            size="sm"
            icon={Sparkles}
            onClick={() => onBatchCreateWork(selectedResources)}
            title="Combine selected resources into a single verified Work Item"
          >
            Create Work ({count})
          </InHouseButton>
        )}

        {onBatchAttachEvidence && (
          <InHouseButton
            variant="contextual"
            size="sm"
            icon={ShieldCheck}
            onClick={() => onBatchAttachEvidence(selectedResources)}
            title="Attach all selected items as cryptographic evidence"
          >
            Attach Evidence
          </InHouseButton>
        )}

        {onBatchLinkWork && (
          <InHouseButton
            variant="secondary"
            size="sm"
            icon={Link2}
            onClick={() => onBatchLinkWork(selectedResources)}
          >
            Link Work
          </InHouseButton>
        )}

        {onBatchArchive && (
          <InHouseButton
            variant="quiet"
            size="sm"
            icon={Archive}
            onClick={() => onBatchArchive(selectedResources)}
          >
            Archive
          </InHouseButton>
        )}

        {onBatchDelete && (
          <InHouseButton
            variant="destructive"
            size="sm"
            icon={Trash2}
            onClick={() => onBatchDelete(selectedResources)}
          >
            Delete
          </InHouseButton>
        )}

        <button
          type="button"
          onClick={onClearSelection}
          className="p-1 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors ml-1 cursor-pointer"
          title="Dismiss selection"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
