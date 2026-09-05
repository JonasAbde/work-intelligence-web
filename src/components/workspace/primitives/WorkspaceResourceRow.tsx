import React from 'react';
import { WorkspaceResource } from '../../../runtime/workspaceResource';
import { WorkspaceSource } from './WorkspaceSource';
import { WorkspacePermissionState } from './WorkspacePermissionState';
import { WorkspaceActionBar } from './WorkspaceActionBar';
import { WorkspaceWorkLink } from './WorkspaceWorkLink';
import { useDensity } from '../../../runtime/primitives/DensityProvider';
import { CheckSquare, Square, Sparkles, ShieldCheck } from 'lucide-react';

export interface WorkspaceResourceRowProps {
  resource: WorkspaceResource;
  isSelected?: boolean;
  isChecked?: boolean;
  onSelect?: (resource: WorkspaceResource) => void;
  onToggleCheck?: (resource: WorkspaceResource) => void;
  onCreateWorkItem?: (resource: WorkspaceResource) => void;
  onAttachEvidence?: (resource: WorkspaceResource) => void;
  onLinkWorkItem?: (resource: WorkspaceResource) => void;
  onNavigateToWorkItem?: (id: string) => void;
  showActionBar?: boolean;
  className?: string;
}

export const WorkspaceResourceRow: React.FC<WorkspaceResourceRowProps> = ({
  resource,
  isSelected = false,
  isChecked = false,
  onSelect,
  onToggleCheck,
  onCreateWorkItem,
  onAttachEvidence,
  onLinkWorkItem,
  onNavigateToWorkItem,
  showActionBar = true,
  className = '',
}) => {
  const { density } = useDensity();

  const getPaddingClass = () => {
    if (density === 'dense') return 'py-1.5 px-3';
    if (density === 'compact') return 'py-2 px-3.5';
    return 'py-3 px-4';
  };

  return (
    <div
      onClick={() => onSelect && onSelect(resource)}
      className={`group relative flex items-center justify-between gap-3 border-b border-slate-800/80 transition-colors cursor-pointer select-none ${getPaddingClass()} ${
        isSelected
          ? 'bg-cyan-950/40 border-l-2 border-l-cyan-400'
          : 'hover:bg-[#0c1222] bg-transparent'
      } ${className}`}
    >
      {/* Left: Checkbox + Provider + Title */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {onToggleCheck && (
          <button
            type="button"
            onClick={e => {
              e.stopPropagation();
              onToggleCheck(resource);
            }}
            className="text-slate-500 hover:text-cyan-300 p-0.5 rounded cursor-pointer shrink-0"
            title={isChecked ? 'Deselect item' : 'Select item'}
          >
            {isChecked ? (
              <CheckSquare className="w-4 h-4 text-cyan-400" />
            ) : (
              <Square className="w-4 h-4" />
            )}
          </button>
        )}

        <WorkspaceSource provider={resource.provider} kind={resource.kind} size="sm" />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4
              className={`font-semibold truncate text-slate-200 ${
                density === 'dense' ? 'text-xs' : 'text-sm'
              }`}
            >
              {resource.title}
            </h4>
            {resource.isActionable && (
              <span className="shrink-0 flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-amber-950/60 border border-amber-800 text-amber-300">
                <Sparkles className="w-2.5 h-2.5" /> Actionable
              </span>
            )}
            {resource.evidenceHash && (
              <span className="shrink-0 hidden md:flex items-center gap-0.5 text-[10px] font-mono px-1 py-0.2 rounded bg-cyan-950/50 text-cyan-300 border border-cyan-800/50">
                <ShieldCheck className="w-2.5 h-2.5" /> Proof
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
            {resource.subtitle && <span className="truncate max-w-sm">{resource.subtitle}</span>}
            {resource.actor && (
              <>
                <span className="text-slate-600 hidden sm:inline">•</span>
                <span className="hidden sm:inline truncate text-slate-400">
                  {resource.actor.name}
                </span>
              </>
            )}
            {resource.modifiedAt && (
              <>
                <span className="text-slate-600 hidden md:inline">•</span>
                <span className="hidden md:inline text-[11px] font-mono text-slate-500">
                  {new Date(resource.modifiedAt).toLocaleDateString([], {
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Right: Linked WorkItems + Permissions / Actions */}
      <div className="flex items-center gap-3 shrink-0">
        {resource.linkedWorkItems && resource.linkedWorkItems.length > 0 && (
          <div className="hidden lg:flex items-center gap-1.5">
            {resource.linkedWorkItems.slice(0, 2).map(wid => (
              <WorkspaceWorkLink
                key={wid}
                workItemId={wid}
                onNavigate={onNavigateToWorkItem}
              />
            ))}
          </div>
        )}

        <WorkspacePermissionState permissions={resource.permissions} />

        {showActionBar && (
          <div
            className="opacity-0 group-hover:opacity-100 transition-opacity hidden sm:flex items-center"
            onClick={e => e.stopPropagation()}
          >
            <WorkspaceActionBar
              resource={resource}
              size="sm"
              onCreateWorkItem={onCreateWorkItem}
              onAttachEvidence={onAttachEvidence}
              onLinkWorkItem={onLinkWorkItem}
            />
          </div>
        )}
      </div>
    </div>
  );
};
