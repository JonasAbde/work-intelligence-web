import React, { useState } from 'react';
import { ReviewQueueItem, WorkItem } from '../../types';
import { 
  Check, 
  X, 
  Edit3, 
  ChevronDown, 
  ChevronUp, 
  AlertTriangle, 
  ShieldCheck, 
  FileText, 
  Info,
  ExternalLink
} from 'lucide-react';
import { Button } from '../ui/Button';
import { PriorityBadge, ConfidenceBadge } from '../ui/StatusBadge';
import { EmptyState } from '../ui/EmptyState';

interface ReviewQueueViewProps {
  reviewQueue: ReviewQueueItem[];
  onApprove: (id: string) => void;
  onReject: (id: string, reason: string) => void;
  onSelectWorkItem: (item: WorkItem) => void;
  onUpdateWorkItem?: (item: WorkItem) => void;
}

export const ReviewQueueView: React.FC<ReviewQueueViewProps> = ({
  reviewQueue,
  onApprove,
  onReject,
  onSelectWorkItem,
  onUpdateWorkItem,
}) => {
  const [selectedReviewId, setSelectedReviewId] = useState<string>(reviewQueue[0]?.id || '');
  const [showTechnicalDetails, setShowTechnicalDetails] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editedTitle, setEditedTitle] = useState<string>('');

  const currentReview = reviewQueue.find((r) => r.id === selectedReviewId) || reviewQueue[0];

  // If no items are pending review
  if (!currentReview || reviewQueue.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#090d16] text-slate-100">
        <EmptyState
          icon={ShieldCheck}
          title="No pending reviews"
          description="The system has handled all incoming tasks within established safety bounds. There are no conflicts, policy blocks, or execution gates awaiting your input."
        />
      </div>
    );
  }

  const handleStartEdit = () => {
    setEditedTitle(currentReview.workItem.title);
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    if (editedTitle.trim()) {
      const updated = {
        ...currentReview.workItem,
        title: editedTitle.trim(),
      };
      if (onUpdateWorkItem) {
        onUpdateWorkItem(updated);
      } else {
        currentReview.workItem.title = editedTitle.trim();
      }
    }
    setIsEditing(false);
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-[#090d16] text-slate-100 h-screen">
      {/* Left Sidebar: Pending Reviews List */}
      <div className="w-full lg:w-80 flex-shrink-0 border-r border-slate-800/80 flex flex-col h-full bg-[#0b0f19]">
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono">
              Pending Decisions
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {reviewQueue.length} awaiting human sign-off
            </p>
          </div>
          <span className="px-2 py-0.5 rounded text-xs font-semibold bg-amber-950/60 text-amber-300 border border-amber-800/40">
            {reviewQueue.length}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
          {reviewQueue.map((rev) => {
            const isSelected = rev.id === currentReview.id;
            return (
              <div
                key={rev.id}
                onClick={() => {
                  setSelectedReviewId(rev.id);
                  setIsEditing(false);
                }}
                className={`p-3 rounded-lg border transition-all cursor-pointer space-y-1.5 text-xs ${
                  isSelected
                    ? 'bg-slate-800/90 border-amber-500/50 shadow-md text-white'
                    : 'bg-slate-900/50 hover:bg-slate-850/80 border-slate-800/80 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-800/40">
                    {rev.category === 'execution_promotion' ? 'Action Gate' : 'Proposed Merge'}
                  </span>
                  <PriorityBadge priority={rev.workItem.priority} />
                </div>
                <div className="font-semibold text-slate-100 line-clamp-1">
                  {rev.workItem.title}
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                  {rev.reasoning}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Canvas: Frictionless Human Decision Guide */}
      <div className="flex-1 overflow-y-auto p-6 sm:p-8 flex flex-col space-y-6">
        <div className="max-w-3xl w-full mx-auto space-y-6">
          
          {/* Header Banner */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-amber-950/80 text-amber-300 border border-amber-800/50">
                  {currentReview.category === 'execution_promotion' ? 'High-Impact Action Gate' : 'Merge Resolution'}
                </span>
                <ConfidenceBadge confidence={currentReview.workItem.confidence} />
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>Item ref: <strong className="font-mono text-slate-200">{currentReview.workItem.id}</strong></span>
                <button
                  onClick={() => onSelectWorkItem(currentReview.workItem)}
                  className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 transition-colors ml-1 cursor-pointer font-medium"
                >
                  <span>Details</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>

            {isEditing ? (
              <div className="space-y-2 pt-2">
                <input
                  type="text"
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  className="w-full px-3 py-1.5 rounded bg-slate-950 border border-cyan-500 text-sm font-semibold text-white focus:outline-none"
                />
                <div className="flex items-center gap-2">
                  <Button variant="primary" size="sm" onClick={handleSaveEdit}>
                    Save Changes
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <h1 className="text-lg font-bold text-slate-100 leading-snug">
                {currentReview.workItem.title}
              </h1>
            )}
          </div>

          {/* 5-Question Frictionless Decision Flow */}
          <div className="space-y-4">
            
            {/* Question 1: What is being proposed? */}
            <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800/70 space-y-1.5">
              <span className="text-[11px] font-mono uppercase tracking-wider text-cyan-400 font-semibold flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5" />
                1. What is being proposed?
              </span>
              <p className="text-sm text-slate-200 leading-relaxed">
                {currentReview.candidate?.suggestedTitle 
                  ? `Merge incoming task "${currentReview.candidate.suggestedTitle}" into existing work item "${currentReview.workItem.title}".`
                  : `Authorize automated dispatch to ${currentReview.workItem.publications[0]?.target || 'production systems'} under owner ${currentReview.workItem.owner.name}.`}
              </p>
            </div>

            {/* Question 2: Why? */}
            <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800/70 space-y-1.5">
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
                2. Why did the system flag this?
              </span>
              <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/40 p-3 rounded-lg border border-slate-850">
                {currentReview.reasoning}
              </p>
            </div>

            {/* Question 3: What changes if I approve? */}
            <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800/70 space-y-1.5">
              <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-400 font-semibold flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5" />
                3. What happens if you approve?
              </span>
              <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside">
                <li>Work item state changes from <strong className="text-slate-100">Needs Review</strong> to <strong className="text-emerald-300">Approved</strong>.</li>
                <li>System publishes execution dispatch to <strong className="text-slate-100">{currentReview.workItem.publications[0]?.target || 'RenOS'}</strong>.</li>
                <li>Audit trail record is permanently sealed with your operator credentials.</li>
              </ul>
            </div>

            {/* Question 4: Is there risk? */}
            <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800/70 space-y-1.5">
              <span className="text-[11px] font-mono uppercase tracking-wider text-amber-400 font-semibold flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                4. Is there risk?
              </span>
              <p className="text-xs text-slate-300 leading-relaxed">
                {currentReview.urgency === 'critical'
                  ? 'High risk: Involves production database snapshots and KMS envelope keys. Requires verified authorization.'
                  : 'Low risk: Standard task assignment deduplication. No destructive infrastructure mutations will be run.'}
              </p>
            </div>

            {/* Question 5: What evidence supports it? */}
            <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800/70 space-y-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                5. Supporting Evidence ({currentReview.workItem.evidence.length} sources)
              </span>
              <div className="space-y-1.5">
                {currentReview.workItem.evidence.map((ev) => (
                  <div key={ev.id} className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-850 text-xs flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-200">{ev.title}</div>
                      <div className="text-[11px] text-slate-400">{ev.snippet}</div>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">{ev.author}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Primary Action Buttons (Approve, Edit, Reject) */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button
              variant="primary"
              size="lg"
              icon={Check}
              onClick={() => onApprove(currentReview.workItem.id)}
              className="flex-1 sm:flex-initial sm:min-w-[160px]"
            >
              Approve & Dispatch
            </Button>
            
            <Button
              variant="secondary"
              size="lg"
              icon={Edit3}
              onClick={handleStartEdit}
            >
              Edit Proposal
            </Button>

            <Button
              variant="danger"
              size="lg"
              icon={X}
              onClick={() => onReject(currentReview.workItem.id, 'Declined by human operator')}
            >
              Reject
            </Button>
          </div>

          {/* Progressive Disclosure: Technical Details (Collapsed by default) */}
          <div className="pt-4 border-t border-slate-800/60">
            <button
              onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
              className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer font-mono"
            >
              {showTechnicalDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              <span>{showTechnicalDetails ? 'Hide technical details' : 'Show technical details (provenance hashes, policy rules, classifier score)'}</span>
            </button>

            {showTechnicalDetails && (
              <div className="mt-3 p-4 rounded-xl bg-slate-950 border border-slate-850 space-y-3 font-mono text-xs animate-in fade-in">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Inference Confidence:</span>
                  <span className="text-cyan-300">{(currentReview.workItem.confidence * 100).toFixed(2)}%</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Triggering Observation:</span>
                  <span className="text-slate-300">{currentReview.workItem.sourceObservationIds.join(', ')}</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Cryptographic Hash:</span>
                  <span className="text-slate-400 truncate max-w-xs">{currentReview.workItem.evidence[0]?.hash || 'sha256:7f83b165...'}</span>
                </div>
                <div className="pt-2 border-t border-slate-900">
                  <div className="text-[11px] text-slate-400 mb-1">Applicable Policy Rules:</div>
                  {currentReview.workItem.policies.map(p => (
                    <div key={p.id} className="text-[11px] text-slate-300 flex items-center justify-between py-0.5">
                      <span>{p.code}: {p.name}</span>
                      <span className="text-amber-400">{p.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
