import React, { useState } from 'react';
import { WorkItem } from '../../../types';
import { WorkspaceResource } from '../../../runtime/workspaceResource';
import { WorkspaceSource } from './WorkspaceSource';
import { WorkspaceActor } from './WorkspaceActor';
import { WorkspacePermissionState } from './WorkspacePermissionState';
import { WorkspaceSyncState } from './WorkspaceSyncState';
import { WorkspaceActionBar } from './WorkspaceActionBar';
import { WorkspaceEvidenceLink } from './WorkspaceEvidenceLink';
import { WorkspaceWorkLink } from './WorkspaceWorkLink';
import { WorkspaceActivity } from './WorkspaceActivity';
import { StatusBadge, PriorityBadge, ConfidenceBadge } from '../../ui/StatusBadge';
import { InHouseButton } from '../../../runtime/primitives/Actions';
import { 
  X, 
  Sparkles, 
  ShieldCheck, 
  ChevronDown, 
  ChevronUp, 
  Code
} from 'lucide-react';

export interface WorkspaceInspectorProps {
  workItem?: WorkItem | null;
  resource?: WorkspaceResource | null;
  onClose: () => void;
  onApproveWorkItem?: (id: string) => void;
  onRejectWorkItem?: (id: string, reason: string) => void;
  onCreateWorkFromResource?: (resource: WorkspaceResource) => void;
  onAttachEvidenceFromResource?: (resource: WorkspaceResource) => void;
  onLinkWorkFromResource?: (resource: WorkspaceResource) => void;
  onNavigateToWorkItem?: (id: string) => void;
}

export const WorkspaceInspector: React.FC<WorkspaceInspectorProps> = ({
  workItem,
  resource,
  onClose,
  onApproveWorkItem,
  onRejectWorkItem,
  onCreateWorkFromResource,
  onAttachEvidenceFromResource,
  onLinkWorkFromResource,
  onNavigateToWorkItem,
}) => {
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);

  if (!workItem && !resource) return null;

  return (
    <aside className="w-full sm:w-[440px] flex-shrink-0 border-l border-slate-800/80 bg-[#0b0f19] flex flex-col h-screen sticky top-0 z-30 shadow-2xl text-slate-100">
      {/* 1. Header with Type / ID & Dismiss */}
      <div className="p-4 border-b border-slate-800/80 flex items-center justify-between bg-[#0e1322]">
        <div className="flex items-center gap-2">
          {workItem ? (
            <>
              <span className="font-mono text-xs text-cyan-400 font-semibold">{workItem.id}</span>
              <StatusBadge status={workItem.status} />
            </>
          ) : resource ? (
            <>
              <WorkspaceSource provider={resource.provider} kind={resource.kind} size="sm" />
              <span className="font-mono text-xs text-slate-400 truncate max-w-[120px]">{resource.id}</span>
            </>
          ) : null}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
          title="Close Inspector (Esc)"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* 2. Scrollable Body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6 text-xs">
        {/* Title & Metadata */}
        <div className="space-y-2">
          <h2 className="text-base font-bold text-slate-100 leading-snug">
            {workItem ? workItem.title : resource?.title}
          </h2>

          {resource && resource.subtitle && (
            <p className="text-xs text-slate-400 font-mono">{resource.subtitle}</p>
          )}

          <div className="flex flex-wrap items-center gap-2 pt-1">
            {workItem && (
              <>
                <PriorityBadge priority={workItem.priority} />
                <ConfidenceBadge confidence={workItem.confidence} />
                <span className="font-mono text-[10px] text-slate-500">
                  {new Date(workItem.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                </span>
              </>
            )}
            {resource && (
              <>
                <WorkspaceSyncState state="saved" />
                <WorkspacePermissionState permissions={resource.permissions} showDetails />
              </>
            )}
          </div>
        </div>

        {/* Work Item: Why It Exists / Inference */}
        {workItem && workItem.whyExists && (
          <div className="p-3.5 rounded-xl bg-cyan-950/20 border border-cyan-900/60 space-y-2">
            <div className="flex items-center gap-1.5 text-cyan-300 font-semibold text-xs">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              Why this exists (Operational Intent)
            </div>
            <p className="text-slate-300 leading-relaxed text-xs">
              {workItem.whyExists.inferenceSummary}
            </p>
            <div className="text-[10px] font-mono text-slate-500 flex items-center justify-between pt-1 border-t border-cyan-950">
              <span>Model: {workItem.whyExists.model}</span>
              <span>Intent: {workItem.whyExists.inferredIntent}</span>
            </div>
          </div>
        )}

        {/* Resource: Detected Work Candidate */}
        {resource?.detectedWork && (
          <div className="p-3.5 rounded-xl bg-amber-950/25 border border-amber-800/70 space-y-2">
            <div className="flex items-center justify-between text-amber-300 font-semibold text-xs">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Actionable Work Intent Extracted
              </span>
              <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-amber-900/60 text-amber-200">
                {Math.round(resource.detectedWork.confidence * 100)}% Conf
              </span>
            </div>
            <p className="text-slate-200 font-medium text-xs">
              {resource.detectedWork.suggestedTitle}
            </p>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              {resource.detectedWork.reasoning}
            </p>
            {onCreateWorkFromResource && (
              <div className="pt-2">
                <InHouseButton
                  variant="primary"
                  size="sm"
                  icon={Sparkles}
                  onClick={() => onCreateWorkFromResource(resource)}
                >
                  Promote to Work Item
                </InHouseButton>
              </div>
            )}
          </div>
        )}

        {/* Summary / Description */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
            {workItem ? 'Work Description' : 'Summary & Content'}
          </span>
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300 leading-relaxed text-xs whitespace-pre-wrap">
            {workItem ? workItem.description : (resource?.summary || 'No textual summary')}
          </div>
        </div>

        {/* Actor / Owner */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
            Owner & Provenance Actor
          </span>
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
            {workItem ? (
              <WorkspaceActor
                actor={{
                  name: workItem.owner.name,
                  email: workItem.owner.email,
                  role: workItem.owner.isAutonomousAgent ? 'Autonomous Agent' : 'Human Assignee',
                }}
              />
            ) : resource?.actor ? (
              <WorkspaceActor actor={resource.actor} />
            ) : (
              <span className="text-slate-500">Unassigned</span>
            )}
          </div>
        </div>

        {/* Evidence & Cryptographic Proof */}
        {workItem && workItem.evidence && workItem.evidence.length > 0 && (
          <div className="space-y-2">
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Cryptographic Evidence ({workItem.evidence.length})</span>
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            </span>
            <div className="space-y-2">
              {workItem.evidence.map(ev => (
                <div key={ev.id} className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-200">{ev.title}</span>
                    <span className="text-[10px] font-mono text-cyan-300">
                      {Math.round(ev.confidenceContribution * 100)}%
                    </span>
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed line-clamp-2">
                    {ev.snippet}
                  </p>
                  <WorkspaceEvidenceLink
                    hash={ev.hash}
                    sourceUri={ev.sourceUri}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Resource Evidence Hash */}
        {resource && resource.evidenceHash && (
          <div className="space-y-1.5">
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
              Verification Hash
            </span>
            <WorkspaceEvidenceLink
              hash={resource.evidenceHash}
              sourceUri={resource.provenanceUri}
              confidence={0.99}
            />
          </div>
        )}

        {/* Linked Work Items (For resource) */}
        {resource && resource.linkedWorkItems && resource.linkedWorkItems.length > 0 && (
          <div className="space-y-1.5">
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
              Linked Work Items
            </span>
            <div className="flex flex-wrap gap-1.5">
              {resource.linkedWorkItems.map(wid => (
                <WorkspaceWorkLink
                  key={wid}
                  workItemId={wid}
                  onNavigate={onNavigateToWorkItem}
                />
              ))}
            </div>
          </div>
        )}

        {/* Activity Log */}
        {workItem && workItem.activity && workItem.activity.length > 0 && (
          <div className="space-y-2">
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
              Recent Activity & Dispatch
            </span>
            <WorkspaceActivity activities={workItem.activity} />
          </div>
        )}

        {/* Progressive Disclosure: Technical Provider Details */}
        <div className="border-t border-slate-800/80 pt-3">
          <button
            type="button"
            onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
            className="flex items-center justify-between w-full text-xs text-slate-400 hover:text-slate-200 transition-colors py-1 cursor-pointer font-mono"
          >
            <span className="flex items-center gap-1.5">
              <Code className="w-3.5 h-3.5 text-cyan-400" />
              Technical Specifications & Scopes
            </span>
            {showTechnicalDetails ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>

          {showTechnicalDetails && (
            <div className="mt-2.5 p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-400 space-y-1.5 overflow-x-auto">
              <div><strong className="text-slate-300">Entity:</strong> {workItem ? 'WorkItem' : 'WorkspaceResource'}</div>
              <div><strong className="text-slate-300">ID:</strong> {workItem ? workItem.id : resource?.id}</div>
              {workItem && (
                <>
                  <div><strong className="text-slate-300">Review Category:</strong> {workItem.reviewCategory}</div>
                  <div><strong className="text-slate-300">Target Publication:</strong> {workItem.publications[0]?.target || 'RenOS'}</div>
                </>
              )}
              {resource && (
                <>
                  <div><strong className="text-slate-300">Provider:</strong> {resource.provider}</div>
                  <div><strong className="text-slate-300">Kind:</strong> {resource.kind}</div>
                  <pre className="text-[10px] text-slate-500 mt-1 whitespace-pre-wrap bg-slate-900/80 p-2 rounded border border-slate-800">
                    {JSON.stringify(resource.metadata, null, 2)}
                  </pre>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 3. Bottom Action Controls */}
      <div className="p-4 border-t border-slate-800/80 bg-[#0e1322] space-y-3">
        {workItem && workItem.status === 'needs_review' && (
          <div className="space-y-2">
            {!showRejectInput ? (
              <div className="grid grid-cols-2 gap-2">
                <InHouseButton
                  variant="primary"
                  size="md"
                  onClick={() => onApproveWorkItem && onApproveWorkItem(workItem.id)}
                  title="Approve work item and dispatch to operational systems"
                >
                  Approve & Dispatch
                </InHouseButton>
                <InHouseButton
                  variant="destructive"
                  size="md"
                  onClick={() => setShowRejectInput(true)}
                  title="Reject or archive item with policy reasoning"
                >
                  Archive / Reject
                </InHouseButton>
              </div>
            ) : (
              <div className="space-y-2">
                <input
                  type="text"
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  placeholder="Reason for rejection (policy, duplicate, invalid)..."
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-rose-700 text-xs text-slate-200 outline-hidden focus:border-rose-500"
                />
                <div className="flex items-center gap-2">
                  <InHouseButton
                    variant="destructive"
                    size="sm"
                    disabled={!rejectReason}
                    onClick={() => {
                      if (onRejectWorkItem) {
                        onRejectWorkItem(workItem.id, rejectReason);
                        setShowRejectInput(false);
                        setRejectReason('');
                      }
                    }}
                  >
                    Confirm Archive
                  </InHouseButton>
                  <InHouseButton
                    variant="quiet"
                    size="sm"
                    onClick={() => setShowRejectInput(false)}
                  >
                    Cancel
                  </InHouseButton>
                </div>
              </div>
            )}
          </div>
        )}

        {resource && (
          <WorkspaceActionBar
            resource={resource}
            size="md"
            onCreateWorkItem={onCreateWorkFromResource}
            onAttachEvidence={onAttachEvidenceFromResource}
            onLinkWorkItem={onLinkWorkFromResource}
          />
        )}
      </div>
    </aside>
  );
};
