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
  ShieldCheck
} from 'lucide-react';
import { StatusBadge, ConfidenceBadge, PriorityBadge } from './ui/StatusBadge';
import { Button } from './ui/Button';

interface InspectorProps {
  item: WorkItem | null;
  onClose: () => void;
  onApprove: (id: string) => void;
  onReject: (id: string, reason: string) => void;
}

export const Inspector: React.FC<InspectorProps> = ({
  item,
  onClose,
  onApprove,
  onReject
}) => {
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');

  if (!item) {
    return null;
  }

  const handleStartEdit = () => {
    setEditedTitle(item.title);
    setIsEditingTitle(true);
  };

  const handleSaveEdit = () => {
    item.title = editedTitle;
    setIsEditingTitle(false);
  };

  return (
    <aside className="w-full sm:w-[420px] flex-shrink-0 border-l border-slate-800/80 bg-[#0b0f19] flex flex-col h-screen sticky top-0 z-20 shadow-2xl text-slate-100">
      {/* Top Header */}
      <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-cyan-400 font-semibold">{item.id}</span>
          <StatusBadge status={item.status} />
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content Body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6 text-xs">
        
        {/* Title & Editable Heading */}
        <div className="space-y-2">
          {isEditingTitle ? (
            <div className="space-y-2">
              <input
                type="text"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded bg-slate-950 border border-cyan-500 text-sm font-semibold text-white focus:outline-none"
              />
              <div className="flex items-center gap-2">
                <Button variant="primary" size="sm" onClick={handleSaveEdit}>Save</Button>
                <Button variant="ghost" size="sm" onClick={() => setIsEditingTitle(false)}>Cancel</Button>
              </div>
            </div>
          ) : (
            <div className="group flex items-start justify-between gap-2">
              <h2 className="text-base font-bold text-slate-100 leading-snug">
                {item.title}
              </h2>
              <button
                onClick={handleStartEdit}
                className="opacity-0 group-hover:opacity-100 text-[10px] text-slate-400 hover:text-cyan-300 transition-opacity cursor-pointer font-mono"
              >
                Edit
              </button>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <PriorityBadge priority={item.priority} />
            <ConfidenceBadge confidence={item.confidence} />
          </div>
        </div>

        {/* Section: Why this exists (Plain human language) */}
        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-1.5">
          <div className="flex items-center gap-1.5 text-cyan-400 font-semibold text-[11px] font-mono uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Why this exists</span>
          </div>
          <p className="text-slate-300 leading-relaxed">
            {item.description}
          </p>
        </div>

        {/* Section: People & Schedule */}
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

        {/* Section: Supporting Sources (Evidence) */}
        <div className="space-y-2">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold">
            Sources & Context ({item.evidence.length})
          </span>
          <div className="space-y-2">
            {item.evidence.map((ev) => (
              <div key={ev.id} className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between font-medium text-slate-200">
                  <span className="text-xs font-semibold truncate">{ev.title}</span>
                  <span className="text-[10px] text-slate-400 font-mono shrink-0 ml-2">{ev.author}</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed italic">
                  "{ev.snippet}"
                </p>
                <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-[10px] font-mono">
                  <span className="flex items-center gap-1 text-cyan-300">
                    <ShieldCheck className="w-3 h-3 text-cyan-400" />
                    {ev.hash ? `${ev.hash.slice(0, 16)}...` : 'sha256:verified'}
                  </span>
                  {ev.sourceUri && (
                    <a
                      href={ev.sourceUri}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 text-slate-400 hover:text-cyan-300 transition-colors"
                    >
                      <span>Workspace Link</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section: Publication Destinations */}
        <div className="space-y-2">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold">
            Connected Destinations
          </span>
          <div className="space-y-1.5">
            {item.publications.map((p) => (
              <div key={p.id} className="p-2.5 rounded-lg bg-slate-900/40 border border-slate-800/60 flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-2">
                  <Send className="w-3 h-3 text-cyan-400" />
                  <span className="font-medium text-slate-200">{p.target}</span>
                </div>
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${
                  p.status === 'published'
                    ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/40'
                    : 'bg-amber-950/40 text-amber-300 border-amber-800/40'
                }`}>
                  {p.status === 'published' ? 'Synced' : 'Pending Approval'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Progressive Disclosure: Technical details */}
        <div className="pt-2 border-t border-slate-800/60">
          <button
            onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
            className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1.5 font-mono cursor-pointer transition-colors"
          >
            {showTechnicalDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            <span>{showTechnicalDetails ? 'Hide technical metadata' : 'Show technical metadata (hashes, policies, model)'}</span>
          </button>

          {showTechnicalDetails && (
            <div className="mt-2.5 p-3 rounded-xl bg-slate-950 border border-slate-850 space-y-2 font-mono text-[11px] text-slate-400 animate-in fade-in">
              <div className="flex justify-between">
                <span>Confidence score:</span>
                <span className="text-cyan-300">{(item.confidence * 100).toFixed(2)}%</span>
              </div>
              <div className="flex justify-between">
                <span>Decision type:</span>
                <span className="text-slate-200">{item.resolution.decisionType}</span>
              </div>
              <div className="flex justify-between">
                <span>Inference model:</span>
                <span className="text-slate-300">aftergraph-v2-extractor</span>
              </div>
              <div className="pt-1.5 border-t border-slate-900">
                <div className="text-slate-400 mb-1">Policy ledger:</div>
                {item.policies.map(p => (
                  <div key={p.id} className="text-slate-300 flex justify-between py-0.5">
                    <span>{p.code}</span>
                    <span className="text-emerald-400">{p.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-slate-800/80 flex items-center gap-2 bg-[#090d16]">
        {item.status === 'needs_review' ? (
          <>
            <Button
              variant="primary"
              size="md"
              icon={Check}
              onClick={() => onApprove(item.id)}
              className="flex-1"
            >
              Approve
            </Button>
            <Button
              variant="danger"
              size="md"
              onClick={() => onReject(item.id, 'Declined from Inspector')}
            >
              Reject
            </Button>
          </>
        ) : (
          <Button
            variant="secondary"
            size="md"
            onClick={onClose}
            className="flex-1"
          >
            Close Details
          </Button>
        )}
      </div>
    </aside>
  );
};
