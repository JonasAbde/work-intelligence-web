import React from 'react';
import {
  Home,
  Layers,
  CheckSquare,
  Activity,
  Cpu,
  GitFork,
  Building2,
  Command,
  Info,
  Sliders,
  HardDrive,
  Mail,
  Calendar,
  FileSpreadsheet,
  FileText,
  StickyNote,
  Search,
  Boxes,
} from 'lucide-react';
import { ConnectionState } from '../types';
import { AppScenario } from '../mock/fixtures';
import { DensityMode } from '../runtime/runtimeTypes';

export type ViewTab =
  | 'home'
  | 'work'
  | 'review'
  | 'activity'
  | 'integrations'
  | 'evidence'
  | 'workspace_search'
  | 'drive'
  | 'gmail'
  | 'calendar'
  | 'sheets'
  | 'docs'
  | 'keep'
  | 'component_registry';

interface NavigationProps {
  activeTab: ViewTab;
  onTabChange: (tab: ViewTab) => void;
  reviewCount: number;
  workCount: number;
  connectionState: ConnectionState;
  isMockMode: boolean;
  density: DensityMode;
  onToggleDensity: () => void;
  activeScenario: AppScenario;
  onScenarioChange: (scenario: AppScenario) => void;
  onOpenCommandPalette: () => void;
  onOpenConnectionDiagnostics: () => void;
  onOpenTelemetry?: () => void;
}

const configuredTenant = import.meta.env.VITE_WORK_INTELLIGENCE_TENANT_ID || 'default';

type NavItem = {
  id: ViewTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  count?: number;
};

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onTabChange,
  reviewCount,
  workCount,
  connectionState,
  isMockMode,
  density,
  onToggleDensity,
  activeScenario,
  onScenarioChange,
  onOpenCommandPalette,
  onOpenConnectionDiagnostics,
  onOpenTelemetry,
}) => {
  const primaryNavItems: NavItem[] = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'work', label: 'Work', icon: Layers, count: workCount },
    { id: 'review', label: 'Review', icon: CheckSquare, count: reviewCount },
    { id: 'activity', label: 'Activity', icon: Activity },
    { id: 'integrations', label: 'Integrations', icon: Cpu },
  ];

  const workspaceNavItems: NavItem[] = [
    { id: 'workspace_search', label: 'Workspace Search', icon: Search },
    { id: 'drive', label: 'Drive & Picker', icon: HardDrive },
    { id: 'gmail', label: 'Gmail', icon: Mail },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'sheets', label: 'Sheets', icon: FileSpreadsheet },
    { id: 'docs', label: 'Docs', icon: FileText },
    ...(isMockMode ? [{ id: 'keep' as ViewTab, label: 'Keep Preview', icon: StickyNote }] : []),
  ];

  const secondaryNavItems: NavItem[] = [
    { id: 'evidence', label: 'Evidence & Provenance', icon: GitFork },
    ...(isMockMode ? [{ id: 'component_registry' as ViewTab, label: 'UI Primitive Sandbox', icon: Boxes }] : []),
  ];

  const getConnectionBadge = () => {
    switch (connectionState) {
      case 'connected': return { text: 'Connected', color: 'bg-emerald-500', textColor: 'text-emerald-400' };
      case 'connecting': return { text: 'Connecting…', color: 'bg-amber-500 animate-pulse', textColor: 'text-amber-400' };
      case 'degraded': return { text: 'Degraded', color: 'bg-amber-500', textColor: 'text-amber-400' };
      case 'unauthorized': return { text: 'Auth Required', color: 'bg-rose-500', textColor: 'text-rose-400' };
      case 'offline': return { text: 'Offline', color: 'bg-slate-500', textColor: 'text-slate-400' };
      case 'preview_mock': return { text: 'Preview Mode', color: 'bg-cyan-400', textColor: 'text-cyan-400' };
      case 'unavailable':
      default:
        return { text: 'Unavailable', color: 'bg-rose-500', textColor: 'text-rose-400' };
    }
  };

  const badge = getConnectionBadge();

  const renderItems = (items: NavItem[]) => items.map(item => {
    const Icon = item.icon;
    const active = activeTab === item.id;
    return (
      <button
        key={item.id}
        type="button"
        onClick={() => onTabChange(item.id)}
        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-all cursor-pointer ${active ? 'bg-slate-800 text-white font-semibold' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'}`}
      >
        <div className="flex items-center gap-2.5">
          <Icon className={`w-4 h-4 ${active ? 'text-cyan-400' : 'text-slate-400'}`} />
          <span>{item.label}</span>
        </div>
        {item.count !== undefined && item.count > 0 && (
          <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${item.id === 'review' ? 'bg-amber-950 text-amber-300 border border-amber-800/60' : 'bg-slate-800 text-slate-300'}`}>
            {item.count}
          </span>
        )}
      </button>
    );
  });

  return (
    <nav className="w-64 flex-shrink-0 border-r border-slate-800/80 bg-[#090d16] flex flex-col justify-between select-none h-screen sticky top-0 z-10">
      <div className="flex flex-col overflow-y-auto">
        <div className="p-3.5 border-b border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center"><div className="w-2 h-2 rounded-xs bg-cyan-400" /></div>
              <span className="font-semibold text-xs text-slate-100 tracking-tight">Aftergraph</span>
            </div>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">Work Intelligence</span>
          </div>

          <div className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800/80 text-xs text-slate-300">
            <div className="flex items-center gap-1.5 truncate">
              <Building2 className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              <span className="truncate text-[11px]">Tenant: {configuredTenant}</span>
            </div>
            {isMockMode && <span className="text-[9px] font-mono text-cyan-400">preview</span>}
          </div>
        </div>

        <div className="p-2.5 border-b border-slate-800/50">
          <button type="button" onClick={onOpenCommandPalette} className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-900/60 hover:bg-slate-850 text-slate-400 hover:text-slate-200 border border-slate-800/80 text-xs transition-colors cursor-pointer">
            <div className="flex items-center gap-2"><Command className="w-3.5 h-3.5 text-cyan-400" /><span className="text-[11px]">Quick Find</span></div>
            <kbd className="text-[10px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">⌘K</kbd>
          </button>
        </div>

        <div className="p-2 space-y-1">{renderItems(primaryNavItems)}</div>

        <div className="px-2 pt-3 pb-1 border-t border-slate-800/60 mt-2 space-y-1">
          <div className="px-2 pb-1 text-[10px] font-mono uppercase tracking-wider text-cyan-400/80">Workspace Surfaces</div>
          {renderItems(workspaceNavItems)}
        </div>

        <div className="px-2 pt-3 pb-1 border-t border-slate-800/60 mt-2 space-y-1">
          <div className="px-2 pb-1 text-[10px] font-mono uppercase tracking-wider text-slate-500">Deep Inspection</div>
          {renderItems(secondaryNavItems)}
        </div>
      </div>

      <div className="p-3 border-t border-slate-800/80 bg-slate-950/40 space-y-2.5">
        {isMockMode && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 px-0.5">
              <span className="flex items-center gap-1"><Sliders className="w-3 h-3" /><span>PREVIEW SCENARIO</span></span>
              <button type="button" onClick={onToggleDensity} className="hover:text-slate-200 cursor-pointer text-[10px]">{density}</button>
            </div>
            <select value={activeScenario} onChange={event => onScenarioChange(event.target.value as AppScenario)} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-[11px] text-slate-200 focus:outline-none focus:border-cyan-500">
              <option value="normal_day">Normal Day</option>
              <option value="all_calm">All Calm</option>
              <option value="integration_issue">Integration Issue</option>
              <option value="high_risk">High-Risk Action</option>
              <option value="new_workspace">Clean Workspace</option>
            </select>
          </div>
        )}

        {!isMockMode && (
          <button type="button" onClick={onToggleDensity} className="w-full text-left px-2 py-1 text-[10px] font-mono text-slate-500 hover:text-slate-300">Density: {density}</button>
        )}

        {onOpenTelemetry && (
          <button type="button" onClick={onOpenTelemetry} className="w-full flex items-center justify-between p-1.5 px-2 rounded-lg bg-slate-900/60 border border-slate-800 hover:bg-slate-800 text-[11px] text-slate-400 transition-colors cursor-pointer" title="Open local browser telemetry">
            <div className="flex items-center gap-1.5"><Activity className="w-3 h-3 text-cyan-400" /><span>Local UX telemetry</span></div>
          </button>
        )}

        <button type="button" onClick={onOpenConnectionDiagnostics} className="w-full flex items-center justify-between p-2 rounded-lg bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer group" title="Inspect backend connectivity status">
          <div className="flex items-center gap-2"><span className={`w-2 h-2 rounded-full ${badge.color}`} /><span className={`text-[11px] font-medium ${badge.textColor}`}>{badge.text}</span></div>
          <Info className="w-3 h-3 text-slate-400 group-hover:text-slate-300" />
        </button>
      </div>
    </nav>
  );
};
