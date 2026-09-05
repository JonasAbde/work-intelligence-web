import React, { useState } from 'react';
import { WorkspaceResource } from '../../../runtime/workspaceResource';
import { WorkspaceSource } from './WorkspaceSource';
import { WorkspacePermissionState } from './WorkspacePermissionState';
import { WorkspaceSyncState } from './WorkspaceSyncState';
import { WorkspaceActionBar } from './WorkspaceActionBar';
import { WorkspaceEvidenceLink } from './WorkspaceEvidenceLink';
import { WorkspaceWorkLink } from './WorkspaceWorkLink';
import { 
  ChevronDown, 
  ChevronUp, 
  Sparkles, 
  Code, 
  Clock, 
  CheckCircle2, 
  Users, 
  MapPin 
} from 'lucide-react';

export interface WorkspaceResourcePreviewProps {
  resource: WorkspaceResource;
  onCreateWorkItem?: (resource: WorkspaceResource) => void;
  onAttachEvidence?: (resource: WorkspaceResource) => void;
  onLinkWorkItem?: (resource: WorkspaceResource) => void;
  onScheduleFollowUp?: (resource: WorkspaceResource) => void;
  onReply?: (resource: WorkspaceResource) => void;
  onNavigateToWorkItem?: (id: string) => void;
  className?: string;
}

export const WorkspaceResourcePreview: React.FC<WorkspaceResourcePreviewProps> = ({
  resource,
  onCreateWorkItem,
  onAttachEvidence,
  onLinkWorkItem,
  onScheduleFollowUp,
  onReply,
  onNavigateToWorkItem,
  className = '',
}) => {
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  // Render provider-specific structured preview content
  const renderStructuredContent = () => {
    const meta = resource.metadata || {};

    if (resource.provider === 'gmail') {
      const bodyText = (meta.body as string) || resource.summary || '';
      return (
        <div className="space-y-3">
          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300 whitespace-pre-wrap font-sans leading-relaxed">
            {bodyText}
          </div>
          {Boolean(meta.hasAttachments) && (
            <div className="text-[11px] text-cyan-300 font-mono flex items-center gap-1.5">
              <span>📎 Attachments detected (PDF / Spec)</span>
            </div>
          )}
        </div>
      );
    }

    if (resource.provider === 'calendar') {
      const attendees = (meta.attendees as Array<{ name: string; email: string; responseStatus?: string }>) || [];
      return (
        <div className="space-y-3 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2.5">
            <div className="flex items-center gap-2 text-slate-300">
              <Clock className="w-4 h-4 text-cyan-400" />
              <span>{resource.subtitle}</span>
            </div>
            {Boolean(meta.location) && (
              <div className="flex items-center gap-2 text-slate-400">
                <MapPin className="w-4 h-4 text-rose-400" />
                <span>{meta.location as string}</span>
              </div>
            )}
            <p className="text-slate-300 pt-1 leading-relaxed">{resource.summary}</p>
          </div>

          {attendees.length > 0 && (
            <div className="space-y-1.5">
              <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5 uppercase tracking-wider">
                <Users className="w-3.5 h-3.5" /> Attendees ({attendees.length})
              </div>
              <div className="flex flex-wrap gap-1.5">
                {attendees.map(a => (
                  <span
                    key={a.email}
                    className="text-[11px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700"
                  >
                    {a.name} ({a.responseStatus || 'accepted'})
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }

    if (resource.provider === 'sheets') {
      const columns = (meta.columns as string[]) || [];
      const sampleRows = (meta.sampleRows as Array<Record<string, string>>) || [];
      return (
        <div className="space-y-3 text-xs">
          <div className="border border-slate-800 rounded-xl overflow-x-auto bg-slate-900/80">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 font-mono text-[11px] text-slate-400">
                  {columns.map(c => (
                    <th key={c} className="py-2 px-3">{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-[11px] text-slate-300">
                {sampleRows.map((r, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/40">
                    {columns.map(c => (
                      <td key={c} className="py-2 px-3 truncate max-w-[140px]">
                        {r[c] || '—'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="text-[11px] text-slate-500 font-mono">
            Structured range preview: {String(meta.rowCount ?? 0)} total rows indexed
          </div>
        </div>
      );
    }

    if (resource.provider === 'keep') {
      const isChecklist = meta.isChecklist as boolean;
      const items = (meta.checklistItems as Array<{ id: string; text: string; done: boolean }>) || [];
      return (
        <div className="space-y-2 text-xs">
          {isChecklist && items.length > 0 ? (
            <div className="space-y-1.5 p-3 rounded-xl bg-slate-900/90 border border-slate-800">
              {items.map(item => (
                <div key={item.id} className="flex items-center gap-2 text-slate-300">
                  <CheckCircle2
                    className={`w-3.5 h-3.5 ${item.done ? 'text-emerald-400' : 'text-slate-600'}`}
                  />
                  <span className={item.done ? 'line-through text-slate-500' : ''}>
                    {item.text}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-300 leading-relaxed">
              {resource.summary}
            </div>
          )}
        </div>
      );
    }

    // Default docs / drive files
    return (
      <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300 leading-relaxed">
        {resource.summary || 'No textual summary available for this artifact.'}
      </div>
    );
  };

  return (
    <div className={`space-y-5 text-slate-200 ${className}`}>
      {/* 1. Header & Source Identification */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <WorkspaceSource provider={resource.provider} kind={resource.kind} />
          <div className="flex items-center gap-2">
            <WorkspaceSyncState state="saved" />
            <WorkspacePermissionState permissions={resource.permissions} showDetails />
          </div>
        </div>

        <h3 className="text-base font-bold text-slate-100 leading-tight">
          {resource.title}
        </h3>

        {resource.subtitle && (
          <p className="text-xs text-slate-400 font-mono">{resource.subtitle}</p>
        )}
      </div>

      {/* 2. Detected Work Candidate / AI Intent */}
      {resource.detectedWork && (
        <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-800/80 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-amber-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Detected Operational Work
            </span>
            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-amber-900/60 text-amber-200">
              {Math.round(resource.detectedWork.confidence * 100)}% Confidence
            </span>
          </div>
          <p className="text-slate-300 text-xs font-medium">
            {resource.detectedWork.suggestedTitle}
          </p>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            {resource.detectedWork.reasoning}
          </p>
        </div>
      )}

      {/* 3. Structured Content */}
      <div className="space-y-1.5">
        <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
          Resource Content
        </span>
        {renderStructuredContent()}
      </div>

      {/* 4. Evidence Link & Linked Work */}
      <div className="space-y-2 pt-1 border-t border-slate-800/80">
        {resource.evidenceHash && (
          <div className="flex items-center justify-between">
            <WorkspaceEvidenceLink
              hash={resource.evidenceHash}
              sourceUri={resource.provenanceUri}
              confidence={0.98}
            />
          </div>
        )}

        {resource.linkedWorkItems && resource.linkedWorkItems.length > 0 && (
          <div className="space-y-1">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
              Linked Work Items
            </span>
            <div className="flex flex-wrap gap-1.5">
              {resource.linkedWorkItems.map(id => (
                <WorkspaceWorkLink
                  key={id}
                  workItemId={id}
                  onNavigate={onNavigateToWorkItem}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 5. Progressive Disclosure: Technical Provider Details */}
      <div className="border-t border-slate-800/80 pt-3">
        <button
          type="button"
          onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
          className="flex items-center justify-between w-full text-xs text-slate-400 hover:text-slate-200 transition-colors py-1 cursor-pointer font-mono"
        >
          <span className="flex items-center gap-1.5">
            <Code className="w-3.5 h-3.5 text-cyan-400" />
            Technical Details & Provenance
          </span>
          {showTechnicalDetails ? (
            <ChevronUp className="w-3.5 h-3.5" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5" />
          )}
        </button>

        {showTechnicalDetails && (
          <div className="mt-2.5 p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-400 space-y-1.5 overflow-x-auto">
            <div><strong className="text-slate-300">ID:</strong> {resource.id}</div>
            <div><strong className="text-slate-300">Provider:</strong> {resource.provider}</div>
            <div><strong className="text-slate-300">Kind:</strong> {resource.kind}</div>
            {resource.evidenceHash && (
              <div><strong className="text-slate-300">Hash:</strong> {resource.evidenceHash}</div>
            )}
            <div><strong className="text-slate-300">Provenance URI:</strong> {resource.provenanceUri || 'n/a'}</div>
            <div className="pt-1">
              <strong className="text-slate-300">Raw Metadata:</strong>
              <pre className="text-[10px] text-slate-500 mt-1 whitespace-pre-wrap bg-slate-900/80 p-2 rounded border border-slate-800">
                {JSON.stringify(resource.metadata, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>

      {/* 6. Contextual Action Bar */}
      <div className="pt-2 border-t border-slate-800/80">
        <WorkspaceActionBar
          resource={resource}
          size="md"
          onCreateWorkItem={onCreateWorkItem}
          onAttachEvidence={onAttachEvidence}
          onLinkWorkItem={onLinkWorkItem}
          onScheduleFollowUp={onScheduleFollowUp}
          onReply={onReply}
        />
      </div>
    </div>
  );
};
