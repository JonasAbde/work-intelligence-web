import React from 'react';
import { WorkItemStatus, Priority } from '../../types';

export const StatusBadge: React.FC<{ status: WorkItemStatus; className?: string }> = ({ 
  status, 
  className = '' 
}) => {
  const config: Record<WorkItemStatus, { label: string; style: string }> = {
    needs_review: {
      label: 'Needs Review',
      style: 'bg-amber-950/40 text-amber-300 border-amber-850',
    },
    in_progress: {
      label: 'In Progress',
      style: 'bg-cyan-950/40 text-cyan-300 border-cyan-850',
    },
    published: {
      label: 'Completed & Published',
      style: 'bg-emerald-950/40 text-emerald-300 border-emerald-850',
    },
    blocked: {
      label: 'Waiting on Input',
      style: 'bg-rose-950/40 text-rose-300 border-rose-850',
    },
    inferred: {
      label: 'Detected',
      style: 'bg-indigo-950/40 text-indigo-300 border-indigo-850',
    },
    approved: {
      label: 'Approved',
      style: 'bg-emerald-950/40 text-emerald-300 border-emerald-850',
    },
    rejected: {
      label: 'Archived',
      style: 'bg-slate-800 text-slate-400 border-slate-700',
    },
    completed: {
      label: 'Finished',
      style: 'bg-emerald-950/40 text-emerald-300 border-emerald-850',
    },
  };

  const item = config[status] || { label: status, style: 'bg-slate-800 text-slate-300 border-slate-700' };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${item.style} ${className}`}>
      {item.label}
    </span>
  );
};

export const ConfidenceBadge: React.FC<{ confidence: number; showScore?: boolean }> = ({ 
  confidence,
  showScore = false 
}) => {
  let label = 'High confidence';
  let style = 'bg-emerald-950/40 text-emerald-300 border-emerald-850';

  if (confidence < 0.75) {
    label = 'Needs review';
    style = 'bg-amber-950/40 text-amber-300 border-amber-850';
  } else if (confidence < 0.88) {
    label = 'Medium confidence';
    style = 'bg-cyan-950/40 text-cyan-300 border-cyan-850';
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium border ${style}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      <span>{label}</span>
      {showScore && <span className="opacity-60 text-[10px]">({(confidence * 100).toFixed(0)}%)</span>}
    </span>
  );
};

export const PriorityBadge: React.FC<{ priority: Priority }> = ({ priority }) => {
  const config: Record<Priority, { label: string; style: string }> = {
    urgent: { label: 'Urgent', style: 'text-rose-400 bg-rose-950/30 border-rose-900/50' },
    high: { label: 'High', style: 'text-amber-400 bg-amber-950/30 border-amber-900/50' },
    medium: { label: 'Normal', style: 'text-slate-300 bg-slate-800/40 border-slate-700/50' },
    low: { label: 'Low', style: 'text-slate-400 bg-slate-900/40 border-slate-800' },
  };

  const item = config[priority];

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${item.style}`}>
      {item.label}
    </span>
  );
};
