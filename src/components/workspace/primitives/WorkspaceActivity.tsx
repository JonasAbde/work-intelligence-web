import React from 'react';
import { ActivityItem } from '../../../types';
import { Clock, Cpu, ShieldCheck } from 'lucide-react';

export interface WorkspaceActivityProps {
  activities: ActivityItem[];
  emptyMessage?: string;
  className?: string;
}

export const WorkspaceActivity: React.FC<WorkspaceActivityProps> = ({
  activities,
  emptyMessage = 'No operational activity recorded for this resource yet.',
  className = '',
}) => {
  if (activities.length === 0) {
    return (
      <div className={`p-4 rounded-xl border border-dashed border-slate-800 text-center text-xs text-slate-500 italic ${className}`}>
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {activities.map((act) => {
        return (
          <div key={act.id} className="flex items-start gap-3 text-xs">
            <div className="p-1 rounded-full bg-slate-900 border border-slate-700 text-cyan-400 mt-0.5 shrink-0">
              {act.isSystem ? <Cpu className="w-3 h-3" /> : <ShieldCheck className="w-3 h-3" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-slate-200 truncate">
                  {act.action}
                </span>
                <span className="text-[10px] font-mono text-slate-500 shrink-0 flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5" />
                  {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="text-slate-400 text-[11px] mt-0.5 leading-relaxed">
                {act.detail}
              </p>
              <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                Actor: {act.actor}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
