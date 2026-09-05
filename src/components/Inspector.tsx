import React, { useState } from 'react';
import { WorkItem } from '../types';
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

  if (!item) return null;

  return (
    <aside className="w-full sm:w-[420px] flex-shrink-0 border-l border-slate-800/80 bg-[#0b0f19] flex flex-col h-screen sticky top-0 z-20 shadow-2xl text-slate-100">
      <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-cyan-400 font-semibold">{item.id}</span>
          <StatusBadge status={item.status} />
        </div>
        <button type="button" onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer" aria-label="Close inspector">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-6 text-xs">
        <div className="space-y-2">
          <h2 className="text-base font-bold text-slate-100 leading-snug">{item.title}</h2>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <PriorityBadge priority={item.priority} />
            <ConfidenceBadge confidence={item.confidence} />
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-1.5">
          <div className="flex items-center gap-1.5 text-cyan-400 font-semibold text-[11px] font-mono uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Why this exists</span>
          </div>
          <p className="text-slate-300 leading-relaxed">{item.description}</p>
        </div>

        <div className="grid grid-cols-2 gap-2 text-slate-300">
          <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800/60 space-y-1">
            <span className="text-[10px] font-mono text-slate-400 uppercase">Assigned to</span>
            <div className="flex items-center gap-1.5 font-medium text-slate-200">
              <User className="w-3.5 h-3.5 text-cyan-400" />
              <span>{item.owner.name}</span>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800/60 space-y-1">
            <span className="text-[10px] font-mono text-slate-400 uppercase">Due Date</span>
            <div className="flex items-center gap-1.5 font-medium text-slate-200 font-mono">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>{item.dueDate ? new Date(item.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'No due date'}</span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold">
            Sources & Context ({item.evidence.length})
          </span>
          {item.evidence.length === 0 ? (
            <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-3 text-[11px] text-slate-500">
              No evidence envelope has been loaded for this item. Open technical evidence only after it is returned by the authoritative backend.
            </div>
          ) : (
            <div className="space-y-2">
              {item.evidence.map(ev => (
                <div key={ev.id} className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between font-medium text-slate-200">
                    <span className="text-xs font-semibold truncate">{ev.title}</span>
                    <span className="text-[10px] text-slate-400 font-mono shrink-0 ml-2">{ev.author}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed italic">“{ev.snippet}”</p>
                  <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-[10px] font-mono">
                    {ev.hash ? (
                      <span className="flex items-center gap-1 text-cyan-300">
                        <ShieldCheck className="w-3 h-3 text-cyan-400" />
                        {ev.hash.slice(0, 20)}…
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-slate-500">
                        <ShieldAlert className="w-3 h-3" />
                        No verified hash supplied
                      </span>
                    )}
                    {ev.sourceUri && (
                      <a href={ev.sourceUri} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-slate-400 hover:text-cyan-300 transition-colors">
                        <span>Source</span>
                        <ExternalLink className="w-2.5 h-2.5" />
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
          {item.publications.length === 0 ? (
            <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-3 text-[11px] text-slate-500">No publication receipt loaded.</div>
          ) : (
            <div className="space-y-1.5">
              {item.publications.map(p => (
                <div key={p.id} className="p-2.5 rounded-lg bg-slate-900/40 border border-slate-800/60 flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-2">
                    <Send className="w-3 h-3 text-cyan-400" />
                    <span className="font-medium text-slate-200">{p.target}</span>
                  </div>
                  <span className="text-slate-400">{p.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="pt-2 border-t border-slate-800/60">
          <button type="button" onClick={() => setShowTechnicalDetails(!showTechnicalDetails)} className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1.5 font-mono cursor-pointer transition-colors">
            {showTechnicalDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            <span>{showTechnicalDetails ? 'Hide technical metadata' : 'Show technical metadata'}</span>
          </button>
          {showTechnicalDetails && (
            <div className="mt-2.5 p-3 rounded-xl bg-slate-950 border border-slate-850 space-y-2 font-mono text-[11px] text-slate-400">
              <div className="flex justify-between"><span>Confidence score:</span><span className="text-cyan-300">{(item.confidence * 100).toFixed(2)}%</span></div>
              <div className="flex justify-between"><span>Decision type:</span><span className="text-slate-200">{item.resolution.decisionType}</span></div>
              <div className="flex justify-between"><span>Inference model:</span><span className="text-slate-300">{item.whyExists.model || 'not reported'}</span></div>
              <div className="pt-1.5 border-t border-slate-900">
                <div className="text-slate-400 mb-1">Policy records:</div>
                {item.policies.length === 0 ? <div className="text-slate-600">None loaded</div> : item.policies.map(p => (
                  <div key={p.id} className="text-slate-300 flex justify-between py-0.5"><span>{p.code}</span><span>{p.status}</span></div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="p-4 border-t border-slate-800/80 flex items-center gap-2 bg-[#090d16]">
        {item.status === 'needs_review' ? (
          <>
            <Button variant="primary" size="md" icon={Check} onClick={() => onApprove(item.id)} className="flex-1">Approve</Button>
            <Button variant="danger" size="md" onClick={() => onReject(item.id, 'Declined from Inspector')}>Reject</Button>
          </>
        ) : (
          <Button variant="secondary" size="md" onClick={onClose} className="flex-1">Close Details</Button>
        )}
      </div>
    </aside>
  );
};
