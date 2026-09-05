import React, { useState } from 'react';
import { IntegrationStatus } from '../../types';
import { 
  RefreshCw, 
  Mail, 
  Calendar, 
  MessageSquare, 
  Code2, 
  Terminal,
  Radio,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Button } from '../ui/Button';

interface IntegrationsViewProps {
  integrations: IntegrationStatus[];
  onRefresh: () => void;
  onReconnect?: (id: string) => void;
}

export const IntegrationsView: React.FC<IntegrationsViewProps> = ({
  integrations,
  onRefresh,
  onReconnect
}) => {
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const getSourceIcon = (type: string) => {
    switch (type) {
      case 'gmail': return Mail;
      case 'calendar': return Calendar;
      case 'conversation': return MessageSquare;
      case 'code': return Code2;
      case 'renos': return Terminal;
      default: return Radio;
    }
  };

  const getSourceDescription = (type: string) => {
    switch (type) {
      case 'gmail': return 'Observes incoming emails from clients and internal teams to detect commitments.';
      case 'calendar': return 'Tracks executive and customer meetings to prepare summaries and follow-ups.';
      case 'conversation': return 'Monitors Slack architecture and operations channels for decisions.';
      case 'code': return 'Watches pull requests, releases, and deployment branches.';
      case 'renos': return 'RenOS operational execution engine for dispatching automated jobs.';
      default: return 'External operational data stream.';
    }
  };

  const handleSync = (id: string) => {
    setSyncingId(id);
    setTimeout(() => {
      setSyncingId(null);
      if (onReconnect) onReconnect(id);
      onRefresh();
    }, 1200);
  };

  return (
    <div className="flex-1 flex flex-col overflow-y-auto bg-[#090d16] text-slate-100 p-6 sm:p-8 space-y-6 max-w-5xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-800/80">
        <div>
          <h1 className="text-xl font-semibold text-slate-100 tracking-tight">
            Integrations
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Connected communication channels and execution systems monitored by Aftergraph.
          </p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          icon={RefreshCw}
          loading={syncingId === 'all'}
          onClick={() => handleSync('all')}
        >
          Check All Connections
        </Button>
      </div>

      {/* Integration Cards List */}
      <div className="space-y-3">
        {integrations.map((item) => {
          const Icon = getSourceIcon(item.type);
          const isOperational = item.status === 'operational';
          const isSyncing = syncingId === item.id;
          const isExpanded = expandedId === item.id;

          return (
            <div
              key={item.id}
              className={`p-4 rounded-xl border transition-all space-y-3 ${
                isOperational 
                  ? 'bg-slate-900/50 border-slate-800/70 hover:border-slate-700' 
                  : 'bg-amber-950/20 border-amber-850/80'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className={`p-2.5 rounded-xl border ${
                    isOperational 
                      ? 'bg-slate-800 text-cyan-400 border-slate-700' 
                      : 'bg-amber-950 text-amber-300 border-amber-800/50'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-slate-100">{item.name}</h3>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium border ${
                        isOperational
                          ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/50'
                          : 'bg-amber-950/60 text-amber-300 border-amber-800/50'
                      }`}>
                        {isOperational ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                        <span>{isOperational ? 'Connected' : 'Connection Paused'}</span>
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      {getSourceDescription(item.type)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto flex-shrink-0">
                  {!isOperational ? (
                    <Button
                      variant="primary"
                      size="sm"
                      icon={RefreshCw}
                      loading={isSyncing}
                      onClick={() => handleSync(item.id)}
                    >
                      Reconnect
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={RefreshCw}
                      loading={isSyncing}
                      onClick={() => handleSync(item.id)}
                    >
                      Sync
                    </Button>
                  )}

                  <button
                    onClick={() => setExpandedId(isExpanded ? null : item.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                  >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Collapsible Technical Details */}
              {isExpanded && (
                <div className="pt-3 border-t border-slate-800/60 font-mono text-xs text-slate-400 grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>Account: <strong className="text-slate-200">{item.authenticatedAs}</strong></div>
                  <div>Sync Latency: <strong className="text-slate-200">{item.latencyMs}ms</strong></div>
                  <div>Event Rate: <strong className="text-slate-200">{item.eventsPerMinute} ev/m</strong></div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
