import React, { useState } from 'react';
import { Observation, WorkItem } from '../../types';
import { 
  Activity, 
  Search, 
  Sparkles, 
  Mail, 
  Calendar, 
  MessageSquare, 
  Code2, 
  Terminal, 
  ChevronRight
} from 'lucide-react';

interface ActivityViewProps {
  observations: Observation[];
  workItems: WorkItem[];
  onSelectWorkItem: (item: WorkItem) => void;
}

export const ActivityView: React.FC<ActivityViewProps> = ({
  observations,
  workItems,
  onSelectWorkItem
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState<string>('all');

  const filteredObservations = observations.filter((obs) => {
    if (sourceFilter !== 'all' && obs.source !== sourceFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        obs.rawText.toLowerCase().includes(q) ||
        obs.actor.name.toLowerCase().includes(q) ||
        obs.inferredAction.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'gmail': return Mail;
      case 'calendar': return Calendar;
      case 'conversation': return MessageSquare;
      case 'code': return Code2;
      case 'renos': return Terminal;
      default: return Activity;
    }
  };

  const getHumanFriendlySummary = (obs: Observation) => {
    if (obs.source === 'gmail') {
      return `Received email from ${obs.actor.name}`;
    }
    if (obs.source === 'renos') {
      return `System telemetry event recorded by ${obs.actor.name}`;
    }
    if (obs.source === 'conversation') {
      return `Chat message posted by ${obs.actor.name} in team channel`;
    }
    if (obs.source === 'code') {
      return `Pull request activity logged by ${obs.actor.name}`;
    }
    return `Observed activity from ${obs.actor.name}`;
  };

  return (
    <div className="flex-1 flex flex-col overflow-y-auto bg-[#090d16] text-slate-100 p-6 sm:p-8 space-y-6 max-w-5xl mx-auto w-full">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-800/80">
        <div>
          <h1 className="text-xl font-semibold text-slate-100 tracking-tight">
            Activity
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            What the system observed and processed autonomously across your team surfaces.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search activity..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Source Filters */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        {[
          { id: 'all', label: 'All Activity' },
          { id: 'gmail', label: 'Email' },
          { id: 'conversation', label: 'Chat' },
          { id: 'code', label: 'GitHub' },
          { id: 'renos', label: 'RenOS' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSourceFilter(tab.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              sourceFilter === tab.id
                ? 'bg-slate-800 text-white font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Activity Timeline */}
      <div className="space-y-3">
        {filteredObservations.map((obs) => {
          const Icon = getSourceIcon(obs.source);
          const linkedWork = obs.linkedWorkItemId 
            ? workItems.find(w => w.id === obs.linkedWorkItemId)
            : null;

          return (
            <div
              key={obs.id}
              className="p-4 rounded-xl bg-slate-900/50 hover:bg-slate-900/80 border border-slate-800/70 transition-all space-y-2.5 text-xs"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-slate-800 text-cyan-400 border border-slate-700">
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-semibold text-slate-200">
                    {getHumanFriendlySummary(obs)}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 font-mono">
                  {new Date(obs.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>

              <p className="text-slate-300 leading-relaxed bg-slate-950/40 p-3 rounded-lg border border-slate-850">
                "{obs.rawText}"
              </p>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 text-[11px] text-slate-400">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-emerald-400" />
                  <span>Inferred: {obs.inferredAction}</span>
                </div>

                {linkedWork && (
                  <button
                    onClick={() => onSelectWorkItem(linkedWork)}
                    className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
                  >
                    <span>View Work Item {linkedWork.id}</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
