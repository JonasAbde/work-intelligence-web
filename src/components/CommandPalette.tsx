import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Home, 
  Activity, 
  Layers, 
  CheckSquare, 
  GitFork, 
  Cpu, 
  RefreshCw,
  HardDrive,
  Mail,
  Calendar,
  FileSpreadsheet,
  FileText,
  StickyNote,
  Boxes
} from 'lucide-react';
import { ViewTab } from './Navigation';
import { WorkItem, Observation } from '../types';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: ViewTab) => void;
  workItems: WorkItem[];
  observations: Observation[];
  onSelectWorkItem: (item: WorkItem) => void;
  onSelectObservation: (obs: Observation) => void;
  onTriggerReviewNext: () => void;
  onRetryConnection: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onNavigate,
  workItems,
  observations,
  onSelectWorkItem,
  onSelectObservation,
  onTriggerReviewNext,
  onRetryConnection
}) => {
  const [query, setQuery] = useState('');

  // Close on escape key, open on Ctrl/Cmd + K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else setQuery('');
      } else if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const quickCommands = [
    {
      id: 'cmd-home',
      title: 'Go to Home',
      category: 'Navigation',
      icon: Home,
      action: () => { onNavigate('home'); onClose(); }
    },
    {
      id: 'cmd-review-next',
      title: 'Review Next Pending Decision',
      category: 'Actions',
      icon: CheckSquare,
      action: () => { onTriggerReviewNext(); onClose(); }
    },
    {
      id: 'cmd-work',
      title: 'Open Work Items',
      category: 'Navigation',
      icon: Layers,
      action: () => { onNavigate('work'); onClose(); }
    },
    {
      id: 'cmd-workspace-search',
      title: 'Open Universal Workspace Graph & Search',
      category: 'Workspace',
      icon: Search,
      action: () => { onNavigate('workspace_search'); onClose(); }
    },
    {
      id: 'cmd-drive',
      title: 'Open Google Drive & Picker',
      category: 'Workspace',
      icon: HardDrive,
      action: () => { onNavigate('drive'); onClose(); }
    },
    {
      id: 'cmd-gmail',
      title: 'Open Gmail Operational Comms',
      category: 'Workspace',
      icon: Mail,
      action: () => { onNavigate('gmail'); onClose(); }
    },
    {
      id: 'cmd-calendar',
      title: 'Open Google Calendar Schedule',
      category: 'Workspace',
      icon: Calendar,
      action: () => { onNavigate('calendar'); onClose(); }
    },
    {
      id: 'cmd-sheets',
      title: 'Open Google Sheets Metric Grid',
      category: 'Workspace',
      icon: FileSpreadsheet,
      action: () => { onNavigate('sheets'); onClose(); }
    },
    {
      id: 'cmd-docs',
      title: 'Open Google Docs Specifications',
      category: 'Workspace',
      icon: FileText,
      action: () => { onNavigate('docs'); onClose(); }
    },
    {
      id: 'cmd-keep',
      title: 'Open Google Keep Notes & Checklists',
      category: 'Workspace',
      icon: StickyNote,
      action: () => { onNavigate('keep'); onClose(); }
    },
    {
      id: 'cmd-activity',
      title: 'Open Activity Timeline',
      category: 'Navigation',
      icon: Activity,
      action: () => { onNavigate('activity'); onClose(); }
    },
    {
      id: 'cmd-integrations',
      title: 'Manage Connected Channels',
      category: 'System',
      icon: Cpu,
      action: () => { onNavigate('integrations'); onClose(); }
    },
    {
      id: 'cmd-provenance',
      title: 'Inspect Provenance & Evidence Chains',
      category: 'Auditing',
      icon: GitFork,
      action: () => { onNavigate('evidence'); onClose(); }
    },
    {
      id: 'cmd-retry',
      title: 'Check Backend Health',
      category: 'System',
      icon: RefreshCw,
      action: () => { onRetryConnection(); onClose(); }
    },
    {
      id: 'cmd-component-registry',
      title: 'UI Primitive Sandbox & Density Inspector',
      category: 'System',
      icon: Boxes,
      action: () => { onNavigate('component_registry'); onClose(); }
    },
  ];

  // Search matching work items & observations
  const matchingWorkItems = workItems.filter(w => 
    w.title.toLowerCase().includes(query.toLowerCase()) ||
    w.id.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 3);

  const matchingObservations = observations.filter(o => 
    o.rawText.toLowerCase().includes(query.toLowerCase()) ||
    o.id.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 2);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 sm:pt-28 px-4 bg-black/60 backdrop-blur-xs">
      <div 
        className="fixed inset-0" 
        onClick={onClose} 
      />
      
      <div className="relative w-full max-w-xl rounded-2xl bg-[#0e1424] border border-slate-700/80 shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-in fade-in zoom-in-95">
        
        {/* Search Input */}
        <div className="flex items-center px-4 py-3 border-b border-slate-800 bg-[#090d16]/80">
          <Search className="w-4 h-4 text-cyan-400 mr-3 flex-shrink-0" />
          <input
            type="text"
            autoFocus
            placeholder="Type a command, search work, or jump to view..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm text-slate-100 placeholder-slate-400 focus:outline-none"
          />
          <kbd className="text-[10px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700 ml-2">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-3">
          
          {/* Quick Actions / Navigation */}
          {query.trim() === '' && (
            <div className="space-y-1">
              <div className="px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-slate-400">
                Quick Commands
              </div>
              {quickCommands.map((cmd) => {
                const Icon = cmd.icon;
                return (
                  <button
                    key={cmd.id}
                    onClick={cmd.action}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{cmd.title}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">{cmd.category}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Work Item Matches */}
          {matchingWorkItems.length > 0 && (
            <div className="space-y-1">
              <div className="px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-slate-400">
                Work Items
              </div>
              {matchingWorkItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectWorkItem(item);
                    onClose();
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer text-left"
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="font-mono text-cyan-400 font-bold">{item.id}</span>
                    <span className="truncate">{item.title}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 uppercase font-mono ml-2">
                    {item.status.replace('_', ' ')}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Observation Matches */}
          {matchingObservations.length > 0 && (
            <div className="space-y-1">
              <div className="px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-slate-400">
                Matching Activity
              </div>
              {matchingObservations.map((obs) => (
                <button
                  key={obs.id}
                  onClick={() => {
                    onSelectObservation(obs);
                    onClose();
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer text-left"
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="font-mono text-slate-400">{obs.id}</span>
                    <span className="truncate">"{obs.rawText}"</span>
                  </div>
                  <span className="text-[10px] text-slate-400 uppercase font-mono ml-2">
                    {obs.source}
                  </span>
                </button>
              ))}
            </div>
          )}

          {query.trim() !== '' && matchingWorkItems.length === 0 && matchingObservations.length === 0 && (
            <div className="p-8 text-center text-xs text-slate-400">
              No matching commands or work items found for "{query}".
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="p-2.5 border-t border-slate-800 bg-[#090d16]/80 text-[11px] text-slate-400 flex items-center justify-between px-4 font-mono">
          <span>Navigate with mouse or keyboard</span>
          <span>Aftergraph Command Mesh</span>
        </div>
      </div>
    </div>
  );
};
