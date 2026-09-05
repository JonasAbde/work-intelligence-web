import React, { useEffect, useState } from 'react';
import { WorkItem } from '../types';
import { apiClient } from '../api/client';
import { isExplicitPreviewMode } from '../runtime/runtimeMode';
import {
  X,
  Sparkles,
  Clock,
  User,
  ChevronDown,
  ChevronUp,
  Check,
  Send,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';
import { StatusBadge, ConfidenceBadge, PriorityBadge } from './ui/StatusBadge';
import { Button } from './ui/Button';

interface InspectorProps {
  item: WorkItem | null;
  onClose: () => void;
  onApprove: (id: string) => void;
  onReject: (id: string, reason: string) => void;
}

export const Inspector: React.FC<InspectorProps> = ({ item, onClose, onApprove, onReject }) => {
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);
  const [hydratedItem, setHydratedItem] = useState<WorkItem | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const previewMode = isExplicitPreviewMode();

  useEffect(() => {
    if (!item || previewMode) {
      setHydratedItem(null);
      setDetailError(null);
      setIsLoadingDetails(false);
      return;
    }

    let cancelled = false;
    setHydratedItem(null);
    setDetailError(null);
    setIsLoadingDetails(true);

    void apiClient.getWorkItem(item.id, false)
      .then(detail => {
        if (!cancelled && detail) setHydratedItem(detail);
      })
      .catch((error: unknown) => {
        if (!cancelled) setDetailError(error instanceof Error ? error.message : 'Failed to load authoritative WorkItem detail.');
      })
      .finally(() => {
        if (!cancelled) setIsLoadingDetails(false);
      });

    return () => {
      cancelled = true;
    };
  }, [item?.id, previewMode]);

  if (!item) return null;
  const displayItem = hydratedItem?.id === item.id ? hydratedItem : item;
  const allowedActions = displayItem.allowedActions;
  const canApprove = previewMode ? displayItem.status === 'needs_review' : allowedActions?.includes('approve') === true;
  const canReject = previewMode ? displayItem.status === 'needs_review' : allowedActions?.includes('reject') === true;

  return (
    <aside className="w-full sm:w-[420px] flex-shrink-0 border-l border-slate-800/80 bg-[#0b0f19] flex flex-col h-screen sticky top-0 z-20 shadow-2xl text-slate-100">
      <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-cyan-400 font-semibold">{displayItem.id}</span>
          <StatusBadge status={displayItem.status} />
          {!previewMode && isLoadingDetails && <span className="text-[10px] font-mono text-slate-500">loading backend detail…</span>}
        </div>
        <button type="button" onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer" aria-label="Close inspector">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-6 text-xs">
        {detailError && (
          <div className="rounded-xl border border-rose-800/70 bg-rose-950/30 p-3 text-[11px] text-rose-300">
            Backend detail unavailable: {detailError}
          </div>
        )}

        <div className="space-y-2">
          <h2 className="text-base font-bold text-slate-100 leading-snug">{displayItem.title}</h2>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <PriorityBadge priority={displayItem.priority} />
            <ConfidenceBadge confidence={displayItem.confidence} />
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-1.5">
          <div className="flex items-center gap-1.5 text-cyan-400 font-semibold text-[11px] font-mono uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Why this exists</span>
          </div>
          <p className="text-slate-300 leading-relaxed">{displayItem.description}</p>
        </div>

        <div className="grid grid-cols-2 gap-2 text-slate-300">
          <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800/60 space-y-1">
            <span className="text-[10px] font-mono text-slate-400 uppercase">Assigned to</span>
            <div className="flex items-center gap-1.5 font-medium text-slate-200">
              <User className="w-3.5 h-3.5 text-cyan-400" />
              <span>{displayItem.owner.name}</span>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800/60 space-y-1">
            <span className="text-[10px] font-mono text-slate-400 uppercase">Due Date</span>
            <div className="flex items-center gap-1.5 font-medium text-slate-200 font-mono">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>{displayItem.dueDate ? new Date(displayItem.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'No due date'}</span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold">Sources & Context ({displayItem.evidence.length})</span>
          {displayItem.evidence.length === 0 ? (
            <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-3 text-[11px] text-slate-500">
              {isLoadingDetails ? 'Loading backend evidence…' : 'No backend evidence records are available for this item.'}
            </div>
          ) : (
            <div className="space-y-2">
              {displayItem.evidence.map(evidence => (
                <div key={evidence.id} className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between font-medium text-slate-200">
                    <span className="text-xs font-semibold truncate">{evidence.title}</span>
                    <span className="text-[10px] text-slate-400 font-mono shrink-0 ml-2">{evidence.author}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed italic">“{evidence.snippet}”</p>
                  <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-[10px] font-mono">
                    {evidence.hash ? (
                      <span className="flex items-center gap-1 text-cyan-300"><ShieldCheck className="w-3 h-3 text-cyan-400" />{evidence.hash.slice(0, 24)}…</span>
                    ) : (
                      <span className="flex items-center gap-1 text-slate-500"><ShieldAlert className="w-3 h-3" />No verified hash supplied</span>
                    )}
                    {evidence.sourceUri && (
                      <a href={evidence.sourceUri} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-slate-400 hover:text-cyan-300 transition-colors">
                        <span>Source</span><ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold">Publication history</span>
          {displayItem.publications.length === 0 ? (
            <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-3 text-[11px] text-slate-500">No backend publication receipt loaded.</div>
          ) : displayItem.publications.map(publication => (
            <div key={publication.id} className="p-2.5 rounded-lg bg-slate-900/40 border border-slate-800/60 flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-2"><Send className="w-3 h-3 text-cyan-400" /><span className="font-medium text-slate-200">{publication.target}</span></div>
              <span className="text-slate-400">{publication.status}{publication.externalReference ? ` · ${publication.externalReference}` : ''}</span>
            </div>
          ))}
        </div>

        <div className="pt-2 border-t border-slate-800/60">
          <button type="button" onClick={() => setShowTechnicalDetails(!showTechnicalDetails)} className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1.5 font-mono cursor-pointer transition-colors">
            {showTechnicalDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            <span>{showTechnicalDetails ? 'Hide technical metadata' : 'Show technical metadata'}</span>
          </button>
          {showTechnicalDetails && (
            <div className="mt-2.5 p-3 rounded-xl bg-slate-950 border border-slate-850 space-y-2 font-mono text-[11px] text-slate-400">
              <div className="flex justify-between"><span>Confidence score:</span><span className="text-cyan-300">{(displayItem.confidence * 100).toFixed(2)}%</span></div>
              <div className="flex justify-between"><span>Decision type:</span><span className="text-slate-200">{displayItem.resolution.decisionType}</span></div>
              <div className="flex justify-between"><span>Inference model:</span><span className="text-slate-300">{displayItem.whyExists.model || 'not reported'}</span></div>
              <div className="flex justify-between"><span>Allowed actions:</span><span className="text-slate-300">{allowedActions?.join(', ') || (previewMode ? 'preview rules' : 'not loaded')}</span></div>
              <div className="pt-1.5 border-t border-slate-900">
                <div className="text-slate-400 mb-1">Transition records:</div>
                {displayItem.activity.length === 0 ? <div className="text-slate-600">None loaded</div> : displayItem.activity.map(entry => (
                  <div key={entry.id} className="text-slate-300 flex justify-between gap-3 py-0.5"><span>{entry.action}</span><span className="truncate">{entry.actor}</span></div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="p-4 border-t border-slate-800/80 flex items-center gap-2 bg-[#090d16]">
        {canApprove || canReject ? (
          <>
            {canApprove && <Button variant="primary" size="md" icon={Check} onClick={() => onApprove(displayItem.id)} className="flex-1">Approve</Button>}
            {canReject && <Button variant="danger" size="md" onClick={() => onReject(displayItem.id, 'Declined from Inspector')}>Reject</Button>}
          </>
        ) : !previewMode && isLoadingDetails ? (
          <Button variant="secondary" size="md" disabled className="flex-1">Loading allowed actions…</Button>
        ) : (
          <Button variant="secondary" size="md" onClick={onClose} className="flex-1">Close Details</Button>
        )}
      </div>
    </aside>
  );
};
