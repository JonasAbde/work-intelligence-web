import React, { useState, useEffect } from 'react';
import { 
  WorkspaceResource, 
  WorkspaceProvider 
} from '../../runtime/workspaceResource';
import { workspaceRuntime } from '../../runtime/workspaceService';
import { telemetry } from '../../runtime/telemetry';
import { WorkspaceSearch } from './primitives/WorkspaceSearch';
import { WorkspaceFilters } from './primitives/WorkspaceFilters';
import { WorkspaceResourceRow } from './primitives/WorkspaceResourceRow';
import { WorkspaceBulkActions } from './primitives/WorkspaceBulkActions';
import { WorkspaceSource } from './primitives/WorkspaceSource';
import { InHouseButton } from '../../runtime/primitives/Actions';
import { 
  RefreshCw, 
  Database
} from 'lucide-react';

export interface UniversalSearchViewProps {
  onSelectResource: (resource: WorkspaceResource) => void;
  onCreateWorkItem?: (resource: WorkspaceResource) => void;
  onAttachEvidence?: (resource: WorkspaceResource) => void;
  onLinkWorkItem?: (resource: WorkspaceResource) => void;
  onBatchCreateWork?: (resources: WorkspaceResource[]) => void;
  onBatchAttachEvidence?: (resources: WorkspaceResource[]) => void;
  onNavigateToWorkItem?: (id: string) => void;
  className?: string;
}

export const UniversalSearchView: React.FC<UniversalSearchViewProps> = ({
  onSelectResource,
  onCreateWorkItem,
  onAttachEvidence,
  onLinkWorkItem,
  onBatchCreateWork,
  onBatchAttachEvidence,
  onNavigateToWorkItem,
  className = '',
}) => {
  const [query, setQuery] = useState('');
  const [activeProvider, setActiveProvider] = useState<WorkspaceProvider | 'all'>('all');
  const [actionableOnly, setActionableOnly] = useState(false);
  const [linkedWorkOnly, setLinkedWorkOnly] = useState(false);
  const [hasEvidenceOnly, setHasEvidenceOnly] = useState(false);
  const [resources, setResources] = useState<WorkspaceResource[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<WorkspaceResource | null>(null);
  const [checkedItems, setCheckedItems] = useState<WorkspaceResource[]>([]);
  const [groupBy, setGroupBy] = useState<'provider' | 'flat'>('provider');

  useEffect(() => {
    performSearch();
  }, [query, activeProvider, actionableOnly, linkedWorkOnly, hasEvidenceOnly]);

  const performSearch = async () => {
    const startTime = performance.now();
    setIsLoading(true);
    try {
      const results = await workspaceRuntime.searchResources({
        query,
        providers: activeProvider === 'all' ? undefined : [activeProvider],
        actionableOnly: actionableOnly || undefined,
        linkedWorkOnly: linkedWorkOnly || undefined,
        hasEvidenceHash: hasEvidenceOnly || undefined,
      });
      setResources(results);
      if (query.trim()) {
        telemetry.record('search_performed', {
          durationMs: Math.round(performance.now() - startTime),
          details: { query, count: results.length },
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const toggleCheck = (res: WorkspaceResource) => {
    setCheckedItems(prev => {
      const exists = prev.some(r => r.id === res.id);
      if (exists) return prev.filter(r => r.id !== res.id);
      return [...prev, res];
    });
  };

  // Group by provider
  const groupedByProvider: Record<WorkspaceProvider, WorkspaceResource[]> = {
    gmail: [],
    calendar: [],
    drive: [],
    docs: [],
    sheets: [],
    keep: [],
  };

  resources.forEach(r => {
    if (groupedByProvider[r.provider]) {
      groupedByProvider[r.provider].push(r);
    }
  });

  const providersWithResults = (Object.keys(groupedByProvider) as WorkspaceProvider[]).filter(
    p => groupedByProvider[p].length > 0
  );

  return (
    <div className={`flex-1 flex flex-col h-full bg-[#090d16] text-slate-100 overflow-hidden ${className}`}>
      {/* Header & Search Bar */}
      <div className="p-4 border-b border-slate-800/80 bg-[#0c101d] space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-950/60 border border-cyan-800 text-cyan-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-100 tracking-tight flex items-center gap-2">
                Universal Workspace Search & Graph
                <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-800/80 text-cyan-300 font-normal">
                  {resources.length} indexed artifacts
                </span>
              </h1>
              <p className="text-xs text-slate-400">
                Live unified index across Gmail, Drive, Docs, Sheets, Calendar, and Keep
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-lg border border-slate-800 bg-slate-900 p-0.5 text-xs">
              <button
                onClick={() => setGroupBy('provider')}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  groupBy === 'provider' ? 'bg-cyan-500/20 text-cyan-300 font-medium' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Group by Provider
              </button>
              <button
                onClick={() => setGroupBy('flat')}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  groupBy === 'flat' ? 'bg-cyan-500/20 text-cyan-300 font-medium' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Flat List
              </button>
            </div>

            <InHouseButton
              variant="secondary"
              size="sm"
              icon={RefreshCw}
              loading={isLoading}
              onClick={() => performSearch()}
            >
              Sync Index
            </InHouseButton>
          </div>
        </div>

        {/* Universal Search component */}
        <WorkspaceSearch
          value={query}
          onChange={setQuery}
          totalResults={resources.length}
          activeProvider={activeProvider}
          onProviderChange={setActiveProvider}
        />

        {/* Filters bar */}
        <WorkspaceFilters
          actionableOnly={actionableOnly}
          onToggleActionable={() => setActionableOnly(!actionableOnly)}
          linkedWorkOnly={linkedWorkOnly}
          onToggleLinkedWork={() => setLinkedWorkOnly(!linkedWorkOnly)}
          hasEvidenceOnly={hasEvidenceOnly}
          onToggleHasEvidence={() => setHasEvidenceOnly(!hasEvidenceOnly)}
        />
      </div>

      {/* Main Results Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-400 flex flex-col items-center gap-3">
            <RefreshCw className="w-5 h-5 animate-spin text-cyan-400" />
            <span>Traversing Workspace graphs & token scopes...</span>
          </div>
        ) : resources.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500 space-y-2">
            <p className="text-slate-300 font-medium">No workspace resources match your query.</p>
            <p>Try clearing filters or search terms like "spec", "release", "sync", or "contract".</p>
          </div>
        ) : groupBy === 'provider' ? (
          providersWithResults.map(provider => {
            const list = groupedByProvider[provider];
            return (
              <div key={provider} className="rounded-xl border border-slate-800/80 bg-[#0b101c]/80 overflow-hidden">
                <div className="px-4 py-2.5 bg-slate-900/90 border-b border-slate-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <WorkspaceSource provider={provider} size="sm" />
                    <span className="text-xs text-slate-400 font-mono">
                      ({list.length} {list.length === 1 ? 'item' : 'items'})
                    </span>
                  </div>
                </div>

                <div className="divide-y divide-slate-800/60">
                  {list.map(res => (
                    <WorkspaceResourceRow
                      key={res.id}
                      resource={res}
                      isSelected={selectedItem?.id === res.id}
                      isChecked={checkedItems.some(c => c.id === res.id)}
                      onSelect={r => {
                        setSelectedItem(r);
                        onSelectResource(r);
                      }}
                      onToggleCheck={toggleCheck}
                      onCreateWorkItem={onCreateWorkItem}
                      onAttachEvidence={onAttachEvidence}
                      onLinkWorkItem={onLinkWorkItem}
                      onNavigateToWorkItem={onNavigateToWorkItem}
                    />
                  ))}
                </div>
              </div>
            );
          })
        ) : (
          <div className="rounded-xl border border-slate-800/80 bg-[#0b101c]/80 overflow-hidden divide-y divide-slate-800/60">
            {resources.map(res => (
              <WorkspaceResourceRow
                key={res.id}
                resource={res}
                isSelected={selectedItem?.id === res.id}
                isChecked={checkedItems.some(c => c.id === res.id)}
                onSelect={r => {
                  setSelectedItem(r);
                  onSelectResource(r);
                }}
                onToggleCheck={toggleCheck}
                onCreateWorkItem={onCreateWorkItem}
                onAttachEvidence={onAttachEvidence}
                onLinkWorkItem={onLinkWorkItem}
                onNavigateToWorkItem={onNavigateToWorkItem}
              />
            ))}
          </div>
        )}
      </div>

      {/* Multi-Select Floating Bulk Actions Bar */}
      <WorkspaceBulkActions
        selectedResources={checkedItems}
        onClearSelection={() => setCheckedItems([])}
        onBatchCreateWork={onBatchCreateWork}
        onBatchAttachEvidence={onBatchAttachEvidence}
      />
    </div>
  );
};
