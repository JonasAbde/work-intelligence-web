import React, { useState } from 'react';
import { useDensity } from '../../runtime/primitives/DensityProvider';
import { DensityMode } from '../../runtime/runtimeTypes';
import { WorkspaceResource, ComponentLifecycleState } from '../../runtime/workspaceResource';
import { WorkspaceResourceRow } from '../workspace/primitives/WorkspaceResourceRow';
import { WorkspaceResourcePreview } from '../workspace/primitives/WorkspaceResourcePreview';
import { WorkspaceActor } from '../workspace/primitives/WorkspaceActor';
import { WorkspaceSource } from '../workspace/primitives/WorkspaceSource';
import { WorkspaceBreadcrumbs } from '../workspace/primitives/WorkspaceBreadcrumbs';
import { WorkspaceSearch } from '../workspace/primitives/WorkspaceSearch';
import { WorkspaceFilters } from '../workspace/primitives/WorkspaceFilters';
import { WorkspaceSyncState } from '../workspace/primitives/WorkspaceSyncState';
import { WorkspaceErrorState } from '../workspace/primitives/WorkspaceErrorState';
import { WorkspacePagination } from '../workspace/primitives/WorkspacePagination';
import { 
  Boxes, 
  Smartphone, 
  Tablet, 
  Monitor 
} from 'lucide-react';

export const ComponentRegistryView: React.FC = () => {
  const { density, setDensity } = useDensity();
  const [viewportMode, setViewportMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [searchVal, setSearchVal] = useState('audit');

  // Sample Mock Resources for inspection
  const sampleDocResource: WorkspaceResource = {
    id: 'reg-doc-01',
    provider: 'docs',
    kind: 'document',
    title: 'Architecture Blueprint: Autonomous Gate Sync Spec',
    subtitle: 'By Chief Architect • 3,420 words',
    summary: 'Detailed RFC outlining supervisory signoff constraints and cross-service telemetry protocols.',
    modifiedAt: new Date().toISOString(),
    actor: {
      name: 'Elena Rostova',
      email: 'elena.rostova@aftergraph.internal',
      role: 'Staff Systems Architect',
    },
    permissions: { canView: true, canEdit: true, canShare: true, role: 'editor' },
    capabilities: {
      open: true,
      preview: true,
      edit: true,
      createWorkItem: true,
      attachEvidence: true,
      linkToWorkItem: true,
      share: true,
    },
    connectionState: 'connected',
    evidenceHash: 'sha256:4f89d3a7e02b6510f92b451379e49b',
    provenanceUri: 'https://docs.google.com/document/d/reg-doc-01',
    linkedWorkItems: ['WI-2041', 'WI-2048'],
    isActionable: true,
    detectedWork: {
      suggestedTitle: 'Execute Architecture RFC Signoff',
      suggestedAction: 'Review security telemetry and dispatch to RenOS pipeline',
      priority: 'high',
      confidence: 0.94,
      reasoning: 'Specification contains unresolved architectural review items flagged by security scanner.',
    },
    metadata: { wordCount: 3420, sections: 4 },
  };

  const sampleEmailResource: WorkspaceResource = {
    id: 'reg-gmail-01',
    provider: 'gmail',
    kind: 'email',
    title: 'Urgent: Client requested revised contract scope for Q3',
    subtitle: 'From: Sarah Connor <s.connor@acme.corp>',
    summary: 'We reviewed the current delivery timeline and request adding supervisory signoff before next Tuesday.',
    modifiedAt: new Date(Date.now() - 3600000).toISOString(),
    actor: {
      name: 'Sarah Connor',
      email: 's.connor@acme.corp',
      role: 'Procurement Director',
    },
    permissions: { canView: true, canEdit: false, role: 'viewer' },
    capabilities: {
      open: true,
      preview: true,
      reply: true,
      createWorkItem: true,
      attachEvidence: true,
      scheduleFollowUp: true,
      archive: true,
    },
    connectionState: 'connected',
    evidenceHash: 'sha256:e3b0c44298fc1c149afbf4c8996fb92',
    provenanceUri: 'https://mail.google.com',
    isActionable: true,
    detectedWork: {
      suggestedTitle: 'Review Contract Scope Change Request',
      suggestedAction: 'Draft reply and publish updated delivery schedule',
      priority: 'urgent',
      confidence: 0.96,
      reasoning: 'External stakeholder request requires immediate response and policy compliance verification.',
    },
    metadata: { isUnread: true, hasAttachments: true },
  };

  const sampleSheetResource: WorkspaceResource = {
    id: 'reg-sheet-01',
    provider: 'sheets',
    kind: 'spreadsheet',
    title: 'Q3 Enterprise Inventory & Telemetry Metrics',
    subtitle: 'Sheet: Core Pipeline (120 rows, 6 columns)',
    summary: 'Columns: Cluster ID, Node Status, Ingestion Latency, Error Rate, Gate Status',
    modifiedAt: new Date().toISOString(),
    actor: {
      name: 'Telemetry Bot',
      email: 'bot@aftergraph.internal',
      role: 'Data Automation',
    },
    permissions: { canView: true, canEdit: true, role: 'editor' },
    capabilities: {
      open: true,
      preview: true,
      createWorkItem: true,
      attachEvidence: true,
      download: true,
    },
    connectionState: 'connected',
    evidenceHash: 'sha256:7a92c342f1b80c149afbf4c8996fb10',
    metadata: {
      columns: ['Cluster', 'Status', 'Latency', 'Error %'],
      sampleRows: [
        { Cluster: 'us-east-1a', Status: 'Healthy', Latency: '42ms', 'Error %': '0.01%' },
        { Cluster: 'eu-west-1b', Status: 'Degraded', Latency: '190ms', 'Error %': '2.10%' },
      ],
    },
  };

  const statesList: ComponentLifecycleState[] = [
    'idle',
    'loading',
    'streaming',
    'optimistic',
    'saved',
    'stale',
    'rate_limited',
    'token_expired',
    'permission_denied',
    'offline',
    'failed',
    'conflict',
  ];

  const getViewportWidth = () => {
    switch (viewportMode) {
      case 'mobile':
        return 'max-w-sm';
      case 'tablet':
        return 'max-w-2xl';
      case 'desktop':
      default:
        return 'max-w-5xl';
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#090d16] text-slate-100 overflow-hidden">
      {/* 1. Top Control Bar */}
      <div className="p-4 border-b border-slate-800/80 bg-[#0c101d] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-cyan-950/60 border border-cyan-800 text-cyan-400">
            <Boxes className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-100 tracking-tight flex items-center gap-2">
              Aftergraph Component Registry & State Matrix
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-800 text-cyan-300">
                /dev/components
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Interactive test harness for every canonical Workspace primitive across states & viewports
            </p>
          </div>
        </div>

        {/* Responsive & Density Selectors */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Viewport controls */}
          <div className="flex items-center rounded-lg border border-slate-800 bg-slate-900 p-0.5 text-xs">
            <button
              onClick={() => setViewportMode('desktop')}
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                viewportMode === 'desktop' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Desktop Viewport (1024px+)"
            >
              <Monitor className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewportMode('tablet')}
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                viewportMode === 'tablet' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Tablet Viewport (768px)"
            >
              <Tablet className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewportMode('mobile')}
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                viewportMode === 'mobile' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Mobile Viewport (380px)"
            >
              <Smartphone className="w-4 h-4" />
            </button>
          </div>

          {/* Density controls */}
          <div className="flex items-center rounded-lg border border-slate-800 bg-slate-900 p-0.5 text-xs">
            {(['comfortable', 'compact', 'dense'] as DensityMode[]).map(d => (
              <button
                key={d}
                onClick={() => setDensity(d)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium capitalize transition-colors cursor-pointer ${
                  density === d ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Scrollable Showcase Canvas */}
      <div className="flex-1 overflow-y-auto p-6 flex justify-center">
        <div className={`w-full ${getViewportWidth()} transition-all duration-200 space-y-10 pb-16`}>
          
          {/* Section 1: Canonical Resource Row */}
          <section className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                1. WorkspaceResourceRow
                <span className="text-[10px] font-mono text-slate-400">Canonical listing primitive</span>
              </h2>
              <span className="text-xs font-mono text-cyan-400">Density: {density}</span>
            </div>

            <div className="rounded-xl border border-slate-800 bg-[#0c111f] overflow-hidden divide-y divide-slate-800/60">
              <WorkspaceResourceRow
                resource={sampleDocResource}
                onSelect={() => {}}
                onToggleCheck={() => {}}
                isChecked={false}
              />
              <WorkspaceResourceRow
                resource={sampleEmailResource}
                isSelected={true}
                isChecked={true}
                onSelect={() => {}}
                onToggleCheck={() => {}}
              />
              <WorkspaceResourceRow
                resource={sampleSheetResource}
                onSelect={() => {}}
                onToggleCheck={() => {}}
              />
            </div>
          </section>

          {/* Section 2: Complete State Matrix Showcase */}
          <section className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                2. WorkspaceSyncState & Lifecycle Matrix
                <span className="text-[10px] font-mono text-slate-400">Comprehensive state indicators</span>
              </h2>
            </div>

            <div className="p-4 rounded-xl border border-slate-800 bg-[#0c111f] flex flex-wrap gap-2.5 items-center">
              {statesList.map(st => (
                <WorkspaceSyncState key={st} state={st} showLabel onRetry={() => {}} />
              ))}
            </div>
          </section>

          {/* Section 3: Error States with Impact Statements */}
          <section className="space-y-3">
            <div className="border-b border-slate-800 pb-2">
              <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                3. WorkspaceErrorState (Impact Statements)
                <span className="text-[10px] font-mono text-slate-400">Actionable remediation UI</span>
              </h2>
            </div>

            <div className="space-y-3">
              <WorkspaceErrorState
                state="token_expired"
                provider="gmail"
                onAction={() => {}}
              />
              <WorkspaceErrorState
                state="rate_limited"
                provider="sheets"
                technicalDetails="RESOURCE_EXHAUSTED_429"
                onAction={() => {}}
              />
            </div>
          </section>

          {/* Section 4: Workspace Actors & Sources */}
          <section className="space-y-3">
            <div className="border-b border-slate-800 pb-2">
              <h2 className="text-sm font-bold text-slate-100">
                4. WorkspaceSource & WorkspaceActor
              </h2>
            </div>

            <div className="p-4 rounded-xl border border-slate-800 bg-[#0c111f] space-y-4">
              <div className="flex flex-wrap gap-2 items-center">
                {(['gmail', 'calendar', 'drive', 'docs', 'sheets', 'keep'] as const).map(p => (
                  <WorkspaceSource key={p} provider={p} />
                ))}
              </div>

              <div className="flex flex-wrap gap-4 items-center pt-2 border-t border-slate-800/80">
                <WorkspaceActor
                  actor={{ name: 'Elena Rostova', email: 'elena@aftergraph.internal', role: 'Staff Architect' }}
                />
                <WorkspaceActor
                  actor={{ name: 'Sarah Connor', email: 's.connor@acme.corp', role: 'External Stakeholder' }}
                />
              </div>
            </div>
          </section>

          {/* Section 5: Breadcrumbs, Search, Filters & Pagination */}
          <section className="space-y-3">
            <div className="border-b border-slate-800 pb-2">
              <h2 className="text-sm font-bold text-slate-100">
                5. Breadcrumbs, Search, Filters & Pagination
              </h2>
            </div>

            <div className="p-4 rounded-xl border border-slate-800 bg-[#0c111f] space-y-4">
              <WorkspaceBreadcrumbs
                provider="drive"
                items={[
                  { id: 'f1', label: 'Engineering Architecture' },
                  { id: 'f2', label: 'Security RFCs' },
                  { id: 'f3', label: 'Autonomous-Gate-Sync.pdf' },
                ]}
              />

              <WorkspaceSearch
                value={searchVal}
                onChange={setSearchVal}
                showProviderFilters={false}
              />

              <WorkspaceFilters
                actionableOnly={true}
                onToggleActionable={() => {}}
                linkedWorkOnly={true}
                onToggleLinkedWork={() => {}}
                hasEvidenceOnly={false}
                onToggleHasEvidence={() => {}}
              />

              <WorkspacePagination
                currentPage={1}
                totalItems={48}
                pageSize={10}
                onPageChange={() => {}}
              />
            </div>
          </section>

          {/* Section 6: Contextual Resource Preview */}
          <section className="space-y-3">
            <div className="border-b border-slate-800 pb-2">
              <h2 className="text-sm font-bold text-slate-100">
                6. WorkspaceResourcePreview
              </h2>
            </div>

            <div className="p-5 rounded-xl border border-slate-800 bg-[#0c111f]">
              <WorkspaceResourcePreview
                resource={sampleDocResource}
                onCreateWorkItem={() => {}}
                onAttachEvidence={() => {}}
                onLinkWorkItem={() => {}}
              />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
