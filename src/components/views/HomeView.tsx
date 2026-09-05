import React from 'react';
import { WorkItem, ReviewQueueItem, IntegrationStatus } from '../../types';
import { 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  ArrowRight, 
  Sparkles, 
  Check, 
  Calendar, 
  RefreshCw
} from 'lucide-react';
import { StatusBadge, PriorityBadge } from '../ui/StatusBadge';
import { Button } from '../ui/Button';
import { DensityMode } from '../../runtime/runtimeTypes';

interface HomeViewProps {
  workItems: WorkItem[];
  reviewQueue: ReviewQueueItem[];
  integrations: IntegrationStatus[];
  onSelectItem: (item: WorkItem) => void;
  onSelectReview: (review: ReviewQueueItem) => void;
  onNavigateToTab: (tab: 'work' | 'review' | 'activity' | 'integrations') => void;
  onApprove: (id: string) => void;
  onReconnectIntegration?: (id: string) => void;
  density?: DensityMode;
}

export const HomeView: React.FC<HomeViewProps> = ({
  workItems,
  reviewQueue,
  integrations,
  onSelectItem,
  onSelectReview,
  onNavigateToTab,
  onApprove,
  onReconnectIntegration,
  density = 'comfortable'
}) => {
  // 1. Check for broken integrations to surface in context
  const failingIntegration = integrations.find(i => i.status === 'failed' || i.status === 'degraded');

  // 2. Needs attention items
  const needsAttention = reviewQueue.slice(0, 3);

  // 3. Recently handled (resolved/published work)
  const recentlyHandled = workItems.filter(w => w.status === 'published' || w.status === 'in_progress').slice(0, 4);

  // 4. Coming up (items with deadlines)
  const upcomingItems = workItems.filter(w => w.dueDate).slice(0, 3);

  const isComfortable = density === 'comfortable';

  return (
    <div className="flex-1 flex flex-col overflow-y-auto bg-[#090d16] text-slate-100 p-6 sm:p-8 max-w-5xl mx-auto w-full space-y-8">
      {/* Calm Header Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 pb-4 border-b border-slate-800/80">
        <div>
          <h1 className="text-xl font-semibold text-slate-100 tracking-tight">
            Good morning, Alex
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {reviewQueue.length > 0 
              ? `${reviewQueue.length} ${reviewQueue.length === 1 ? 'item requires' : 'items require'} your decision today. The system is handling the rest.`
              : "Everything is running smoothly. Autonomous operations are up to date."}
          </p>
        </div>
      </div>

      {/* Contextual Integration Warning (Only surfaces when something is actually broken) */}
      {failingIntegration && (
        <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-850 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs animate-in fade-in">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-amber-900/50 text-amber-300 border border-amber-800/50 mt-0.5">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <div className="font-semibold text-amber-200">
                {failingIntegration.name} is currently disconnected
              </div>
              <p className="text-amber-300/80 text-[11px] mt-0.5">
                New incoming messages cannot be observed automatically until connection is restored.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onReconnectIntegration?.(failingIntegration.id)}
              icon={RefreshCw}
            >
              Reconnect
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigateToTab('integrations')}
            >
              Details
            </Button>
          </div>
        </div>
      )}

      {/* SECTION 1: Needs Your Attention */}
      {needsAttention.length > 0 ? (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-200 font-mono">
                Needs your attention ({reviewQueue.length})
              </h2>
            </div>
            <button
              onClick={() => onNavigateToTab('review')}
              className="text-xs text-slate-400 hover:text-cyan-300 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>View all pending decisions</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-2.5">
            {needsAttention.map((rev) => (
              <div
                key={rev.id}
                className="p-4 rounded-xl bg-slate-900/70 hover:bg-slate-900 border border-slate-800/80 hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div 
                  className="min-w-0 flex-1 cursor-pointer"
                  onClick={() => onSelectReview(rev)}
                >
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-800/40">
                      {rev.category === 'execution_promotion' ? 'Action Authorization' : 'Review Proposal'}
                    </span>
                    <PriorityBadge priority={rev.workItem.priority} />
                    <span className="text-[11px] text-slate-400">·</span>
                    <span className="text-[11px] text-slate-400 truncate">
                      Source: {rev.workItem.evidence[0]?.title || 'Customer communication'}
                    </span>
                  </div>

                  <h3 className="text-sm font-semibold text-slate-100 hover:text-cyan-300 transition-colors">
                    {rev.workItem.title}
                  </h3>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed line-clamp-2">
                    {rev.reasoning}
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button
                    variant="primary"
                    size="sm"
                    icon={Check}
                    onClick={() => onApprove(rev.workItem.id)}
                  >
                    Approve
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => onSelectReview(rev)}
                  >
                    Review
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : (
        /* Calm Banner when all caught up */
        <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900/80 to-slate-900/30 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-100">
                You are all caught up
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                No items require human intervention right now. Autonomous tasks are being dispatched safely within policy boundaries.
              </p>
            </div>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onNavigateToTab('activity')}
          >
            View System Activity
          </Button>
        </div>
      )}

      {/* SECTION 2: Recently Handled (What the system resolved automatically) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-200 font-mono">
              Recently handled automatically
            </h2>
          </div>
          <button
            onClick={() => onNavigateToTab('work')}
            className="text-xs text-slate-400 hover:text-cyan-300 flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>View all work items</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {recentlyHandled.map((item) => (
            <div
              key={item.id}
              onClick={() => onSelectItem(item)}
              className={`p-4 rounded-xl bg-slate-900/50 hover:bg-slate-900/80 border border-slate-800/70 hover:border-slate-700 transition-all cursor-pointer flex flex-col justify-between space-y-3 group ${
                isComfortable ? 'py-4' : 'py-3'
              }`}
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-medium text-cyan-400">
                    {item.id}
                  </span>
                  <StatusBadge status={item.status} />
                </div>
                <h4 className="text-xs font-semibold text-slate-100 group-hover:text-cyan-200 transition-colors line-clamp-1">
                  {item.title}
                </h4>
                <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                  {item.description}
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-[10px] text-slate-400">
                <span className="text-slate-300">
                  {item.owner.isAutonomousAgent ? 'Resolved autonomously' : `Assigned to ${item.owner.name}`}
                </span>
                <span>
                  {item.publications[0]?.target ? `Synced to ${item.publications[0].target}` : 'Completed'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 3: Coming Up (Deadlines & Upcoming Follow-ups) */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-cyan-400" />
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-200 font-mono">
            Coming up
          </h2>
        </div>

        <div className="space-y-2">
          {upcomingItems.map((item) => (
            <div
              key={item.id}
              onClick={() => onSelectItem(item)}
              className="p-3.5 rounded-xl bg-slate-900/40 hover:bg-slate-900/70 border border-slate-800/60 hover:border-slate-700 transition-all cursor-pointer flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 rounded-lg bg-slate-800/80 text-slate-300 border border-slate-700/60">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" />
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-slate-200 truncate">{item.title}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5 truncate">
                    Owner: {item.owner.name} · {item.resolution.decisionType}
                  </div>
                </div>
              </div>

              <div className="text-right flex-shrink-0 font-mono text-[11px] text-slate-300">
                {item.dueDate ? new Date(item.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'Next week'}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
