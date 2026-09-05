import { useCallback, useEffect, useState } from 'react';
import {
  ConnectionState,
  IntegrationStatus,
  Observation,
  ReviewQueueItem,
  SystemMetrics,
  WorkItem,
} from './types';
import { apiClient, HealthCheckResult } from './api/client';
import { Navigation, ViewTab } from './components/Navigation';
import { Inspector } from './components/Inspector';
import { CommandPalette } from './components/CommandPalette';
import { ConnectionModal } from './components/ConnectionModal';
import { HomeView } from './components/views/HomeView';
import { WorkView } from './components/views/WorkView';
import { ReviewQueueView } from './components/views/ReviewQueueView';
import { ActivityView } from './components/views/ActivityView';
import { IntegrationsView } from './components/views/IntegrationsView';
import { EvidenceGraphView } from './components/views/EvidenceGraphView';
import { Toast, ToastMessage } from './components/ui/Toast';
import { AppScenario, getScenarioData } from './mock/fixtures';
import { DensityProvider } from './runtime/primitives/DensityProvider';
import { DriveSurface } from './components/workspace/DriveSurface';
import { GmailSurface } from './components/workspace/GmailSurface';
import { CalendarSurface } from './components/workspace/CalendarSurface';
import { SheetsSurface } from './components/workspace/SheetsSurface';
import { DocsSurface } from './components/workspace/DocsSurface';
import { KeepSurface } from './components/workspace/KeepSurface';
import { UniversalSearchView } from './components/workspace/UniversalSearchView';
import { ComponentRegistryView } from './components/dev/ComponentRegistryView';
import { TelemetryHUD } from './components/workspace/TelemetryHUD';
import { AttachEvidenceModal } from './components/workspace/AttachEvidenceModal';
import { WorkspaceResource } from './runtime/workspaceResource';
import { DensityMode, DriveItem, GmailMessageItem, KeepNoteItem } from './runtime/runtimeTypes';
import { STORAGE_KEYS, loadPersistedState, savePersistedState } from './runtime/persistence';
import { isExplicitPreviewMode } from './runtime/runtimeMode';

const EMPTY_METRICS: SystemMetrics = {
  autonomousResolutionRate: 0,
  humanInterventionRatio: 0,
  meanInferenceLatencyMs: 0,
  activeObservationsToday: 0,
  workItemsDiscoveredToday: 0,
  pendingReviewCount: 0,
  policyAlignmentScore: 0,
};

function backendPriority(priority?: string): 'low' | 'medium' | 'high' | 'critical' | undefined {
  if (!priority) return undefined;
  if (priority === 'urgent' || priority === 'critical') return 'critical';
  if (priority === 'high') return 'high';
  if (priority === 'low') return 'low';
  return 'medium';
}

function makePreviewWorkItem(title: string, description: string, priority: WorkItem['priority'] = 'medium'): WorkItem {
  const now = new Date().toISOString();
  const id = `PREVIEW-${Date.now()}`;
  return {
    id,
    title,
    description,
    status: 'needs_review',
    priority,
    owner: { name: 'Preview', email: '', isAutonomousAgent: false },
    createdAt: now,
    updatedAt: now,
    confidence: 0,
    whyExists: {
      inferenceSummary: 'Explicit preview item. No production inference claim.',
      model: 'preview-only',
      triggerObservationId: '',
      inferredIntent: 'Preview interaction',
    },
    resolution: {
      decisionType: 'human_created',
      details: 'Created only inside explicit preview mode.',
    },
    policies: [],
    evidence: [],
    publications: [],
    activity: [],
    sourceObservationIds: [],
    reviewCategory: 'high_confidence',
  };
}

export default function App() {
  const [previewMode] = useState(() => isExplicitPreviewMode());
  const previewData = getScenarioData('normal_day');

  const [activeTab, setActiveTab] = useState<ViewTab>('home');
  const [isTelemetryOpen, setIsTelemetryOpen] = useState(false);
  const [density, setDensity] = useState<DensityMode>(() => loadPersistedState<DensityMode>(STORAGE_KEYS.DENSITY, 'comfortable'));
  const [activeScenario, setActiveScenario] = useState<AppScenario>('normal_day');
  const [connectionState, setConnectionState] = useState<ConnectionState>(previewMode ? 'preview_mock' : 'connecting');
  const [healthResult, setHealthResult] = useState<HealthCheckResult | null>(null);
  const [isCheckingBackend, setIsCheckingBackend] = useState(false);
  const isMockMode = previewMode;

  const [workItems, setWorkItems] = useState<WorkItem[]>(previewMode ? previewData.workItems : []);
  const [observations, setObservations] = useState<Observation[]>(previewMode ? previewData.observations : []);
  const [reviewQueue, setReviewQueue] = useState<ReviewQueueItem[]>(previewMode ? previewData.reviewQueue : []);
  const [integrations, setIntegrations] = useState<IntegrationStatus[]>(previewMode ? previewData.integrations : []);
  const [, setMetrics] = useState<SystemMetrics>(previewMode ? previewData.metrics : EMPTY_METRICS);

  const [selectedWorkItem, setSelectedWorkItem] = useState<WorkItem | null>(null);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isConnectionModalOpen, setIsConnectionModalOpen] = useState(false);
  const [evidenceTargetResource, setEvidenceTargetResource] = useState<WorkspaceResource | null>(null);
  const [batchEvidenceTargetResources, setBatchEvidenceTargetResources] = useState<WorkspaceResource[]>([]);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  useEffect(() => {
    savePersistedState(STORAGE_KEYS.DENSITY, density);
  }, [density]);

  const refreshCanonicalState = useCallback(async () => {
    const [items, obs, queue, integ, met] = await Promise.all([
      apiClient.getWorkItems(false),
      apiClient.getObservations(false),
      apiClient.getReviewQueue(false),
      apiClient.getIntegrations(false),
      apiClient.getMetrics(false),
    ]);
    setWorkItems(items);
    setObservations(obs);
    setReviewQueue(queue);
    setIntegrations(integ);
    setMetrics(met);
    setSelectedWorkItem(previous => previous ? items.find(item => item.id === previous.id) ?? null : null);
  }, []);

  const checkBackendHealth = useCallback(async () => {
    if (previewMode) {
      setConnectionState('preview_mock');
      return;
    }

    setIsCheckingBackend(true);
    try {
      const result = await apiClient.checkHealth();
      setHealthResult(result);
      setConnectionState(result.state);
      if (result.state === 'connected') {
        await refreshCanonicalState();
      }
    } catch (error: unknown) {
      setConnectionState('unavailable');
      setHealthResult({
        state: 'unavailable',
        apiUrl: '/api',
        errorMessage: error instanceof Error ? error.message : 'Backend connection failed.',
        timestamp: new Date().toISOString(),
      });
    } finally {
      setIsCheckingBackend(false);
    }
  }, [previewMode, refreshCanonicalState]);

  useEffect(() => {
    void checkBackendHealth();
  }, [checkBackendHealth]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        setIsCommandPaletteOpen(previous => !previous);
      } else if (event.key === 'Escape') {
        if (isInspectorOpen) setIsInspectorOpen(false);
        else if (isCommandPaletteOpen) setIsCommandPaletteOpen(false);
        else if (isConnectionModalOpen) setIsConnectionModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCommandPaletteOpen, isConnectionModalOpen, isInspectorOpen]);

  const addPreviewItem = (item: WorkItem, reason: string) => {
    setWorkItems(previous => [item, ...previous]);
    setReviewQueue(previous => [{
      id: `review-${item.id}`,
      workItem: item,
      category: 'high_confidence',
      urgency: item.priority === 'urgent' ? 'critical' : item.priority === 'high' ? 'high' : 'normal',
      reasoning: reason,
    }, ...previous]);
    setSelectedWorkItem(item);
    setToast({ id: `preview-${Date.now()}`, title: 'Preview item created', description: 'Local state changed only because ?preview=1 is active.', duration: 4000 });
  };

  const handleScenarioChange = (scenario: AppScenario) => {
    if (!previewMode) {
      setToast({ id: `scenario-blocked-${Date.now()}`, title: 'Preview only', description: 'Scenario fixtures are disabled in live mode. Use ?preview=1 explicitly.', duration: 5000 });
      return;
    }
    const data = getScenarioData(scenario);
    setActiveScenario(scenario);
    setWorkItems(data.workItems);
    setObservations(data.observations);
    setReviewQueue(data.reviewQueue);
    setIntegrations(data.integrations);
    setMetrics(data.metrics);
    setSelectedWorkItem(null);
    setIsInspectorOpen(false);
  };

  const handleApproveWorkItem = async (id: string) => {
    if (previewMode) {
      setWorkItems(previous => previous.map(item => item.id === id ? { ...item, status: 'approved' } : item));
      setReviewQueue(previous => previous.filter(review => review.workItem.id !== id));
      setSelectedWorkItem(previous => previous?.id === id ? { ...previous, status: 'approved' } : previous);
      setToast({ id: `preview-approve-${id}`, title: 'Approved in preview', description: 'Preview state is Approved. Nothing was published or executed.', duration: 4000 });
      return;
    }

    try {
      await apiClient.approveWorkItem(id, false);
      await refreshCanonicalState();
      setToast({ id: `approve-${id}`, title: 'Approved', description: 'Authoritative backend state changed to Approved. Publication remains separate.', duration: 4500 });
    } catch (error: unknown) {
      setToast({ id: `approve-failed-${id}`, title: 'Approval failed', description: error instanceof Error ? error.message : 'Backend rejected the approval.', duration: 6000 });
    }
  };

  const handleRejectWorkItem = async (id: string, reason: string) => {
    if (previewMode) {
      setWorkItems(previous => previous.map(item => item.id === id ? { ...item, status: 'rejected' } : item));
      setReviewQueue(previous => previous.filter(review => review.workItem.id !== id));
      setSelectedWorkItem(previous => previous?.id === id ? { ...previous, status: 'rejected' } : previous);
      setToast({ id: `preview-reject-${id}`, title: 'Rejected in preview', description: reason || 'Preview item rejected.', duration: 4000 });
      return;
    }

    try {
      await apiClient.rejectWorkItem(id, reason, false);
      await refreshCanonicalState();
      setToast({ id: `reject-${id}`, title: 'Rejected', description: 'Authoritative backend state changed to Rejected.', duration: 4000 });
    } catch (error: unknown) {
      setToast({ id: `reject-failed-${id}`, title: 'Rejection failed', description: error instanceof Error ? error.message : 'Backend rejected the request.', duration: 6000 });
    }
  };

  const handleReconnectIntegration = (integrationId: string) => {
    if (previewMode) {
      setIntegrations(previous => previous.map(integration => integration.id === integrationId ? { ...integration, status: 'operational' as const } : integration));
      return;
    }
    setToast({ id: `reconnect-blocked-${Date.now()}`, title: 'Reconnect unavailable', description: 'The authoritative backend has no integration reconnect write contract yet. No state was fabricated.', duration: 6000 });
  };

  const handlePromoteGmailToWorkItem = async (message: GmailMessageItem) => {
    if (previewMode) {
      const candidate = message.extractedWorkItemCandidate;
      addPreviewItem(
        makePreviewWorkItem(candidate?.suggestedTitle || `Process: ${message.subject}`, candidate?.suggestedAction || message.snippet, candidate?.priority || 'medium'),
        candidate?.reasoning || 'Explicit Gmail preview flow.',
      );
      return;
    }

    try {
      const candidate = message.extractedWorkItemCandidate;
      const result = await apiClient.ingestObservation({
        source: 'gmail',
        text: message.body || message.snippet || message.subject,
        external_id: `gmail:${message.id}`,
        actor: message.from,
        occurred_at: message.date,
        title_hint: candidate?.suggestedTitle || message.subject,
        priority_hint: backendPriority(candidate?.priority),
        metadata: { provider: 'gmail', thread_id: message.threadId, subject: message.subject },
      }, false);
      await refreshCanonicalState();
      setToast({ id: `gmail-ingest-${Date.now()}`, title: 'Gmail observation ingested', description: `Backend resolution action: ${result?.action || 'accepted'}.`, duration: 4500 });
    } catch (error: unknown) {
      setToast({ id: `gmail-ingest-failed-${Date.now()}`, title: 'Gmail ingestion failed', description: error instanceof Error ? error.message : 'Backend rejected the Gmail observation.', duration: 6000 });
    }
  };

  const handlePromoteKeepToWorkItem = (note: KeepNoteItem) => {
    if (!previewMode) {
      setToast({ id: `keep-blocked-${Date.now()}`, title: 'Keep is preview-only', description: 'No supported live Google Keep connector is configured, so no WorkItem was fabricated.', duration: 6000 });
      return;
    }
    const description = note.isChecklist ? note.checklistItems.map(item => item.text).join('; ') : note.content;
    addPreviewItem(makePreviewWorkItem(note.title, description), 'Explicit Google Keep preview flow.');
  };

  const handleAttachDriveToWorkItem = (file: DriveItem) => {
    if (!previewMode) {
      setToast({ id: `drive-evidence-blocked-${Date.now()}`, title: 'Evidence write unavailable', description: 'V2 exposes evidence reads but no authoritative evidence-attachment write contract yet.', duration: 6000 });
      return;
    }
    if (!selectedWorkItem) {
      setToast({ id: `drive-evidence-no-target-${Date.now()}`, title: 'Select a preview WorkItem', description: 'Choose a preview WorkItem before attaching preview context.', duration: 4000 });
      return;
    }
    const evidence = {
      id: `preview-drive-${Date.now()}`,
      type: 'document' as const,
      title: file.name,
      snippet: `Preview Drive context (${file.mimeType}).`,
      timestamp: file.modifiedTime,
      author: file.ownerName || 'Preview Drive user',
      sourceUri: file.webViewLink,
      hash: '',
      confidenceContribution: 0,
    };
    setWorkItems(previous => previous.map(item => item.id === selectedWorkItem.id ? { ...item, evidence: [...item.evidence, evidence] } : item));
    setSelectedWorkItem(previous => previous ? { ...previous, evidence: [...previous.evidence, evidence] } : null);
  };

  const handleCreateWorkItemFromResource = async (resource: WorkspaceResource) => {
    const summary = resource.summary || resource.subtitle || resource.title;
    if (previewMode) {
      addPreviewItem(
        makePreviewWorkItem(resource.detectedWork?.suggestedTitle || resource.title, resource.detectedWork?.suggestedAction || summary, resource.detectedWork?.priority || 'medium'),
        resource.detectedWork?.reasoning || `Explicit ${resource.provider} preview flow.`,
      );
      return;
    }

    try {
      const rawId = typeof resource.metadata?.rawId === 'string' ? resource.metadata.rawId : resource.id;
      const result = await apiClient.ingestObservation({
        source: resource.provider,
        text: summary,
        external_id: `${resource.provider}:${rawId}`,
        actor: resource.actor?.email || resource.actor?.name,
        occurred_at: resource.modifiedAt,
        title_hint: resource.detectedWork?.suggestedTitle || resource.title,
        priority_hint: backendPriority(resource.detectedWork?.priority),
        metadata: {
          provider: resource.provider,
          kind: resource.kind,
          resource_id: rawId,
          provenance_uri: resource.provenanceUri || null,
        },
      }, false);
      await refreshCanonicalState();
      setToast({ id: `resource-ingest-${Date.now()}`, title: 'Resource ingested', description: `Backend resolution action: ${result?.action || 'accepted'}.`, duration: 4500 });
    } catch (error: unknown) {
      setToast({ id: `resource-ingest-failed-${Date.now()}`, title: 'Resource ingestion failed', description: error instanceof Error ? error.message : 'Backend rejected the resource observation.', duration: 6000 });
    }
  };

  const attachPreviewResource = (target: WorkItem, resource: WorkspaceResource) => {
    const summary = resource.summary || resource.subtitle || resource.title;
    const evidence = {
      id: `preview-evidence-${Date.now()}-${resource.id}`,
      type: 'document' as const,
      title: resource.title,
      snippet: summary.slice(0, 240),
      timestamp: resource.modifiedAt || new Date().toISOString(),
      author: resource.actor?.name || 'Preview source',
      sourceUri: resource.provenanceUri,
      hash: '',
      confidenceContribution: 0,
    };
    setWorkItems(previous => previous.map(item => item.id === target.id ? { ...item, evidence: [...item.evidence, evidence] } : item));
    setSelectedWorkItem(previous => previous?.id === target.id ? { ...previous, evidence: [...previous.evidence, evidence] } : previous);
    setIsInspectorOpen(true);
  };

  const handleAttachResourceToTarget = (target: WorkItem, resource: WorkspaceResource) => {
    if (!previewMode) {
      setToast({ id: `evidence-blocked-${Date.now()}`, title: 'Evidence write unavailable', description: 'The backend does not expose an evidence-attachment write contract. No local canonical evidence was created.', duration: 6000 });
      return;
    }
    attachPreviewResource(target, resource);
  };

  const handleBatchAttachResourcesToTarget = (target: WorkItem, resources: WorkspaceResource[]) => {
    if (!previewMode) {
      setToast({ id: `batch-evidence-blocked-${Date.now()}`, title: 'Evidence write unavailable', description: 'Batch evidence attachment is disabled in live mode until V2 owns the write contract.', duration: 6000 });
      return;
    }
    resources.forEach(resource => attachPreviewResource(target, resource));
  };

  const handleAttachEvidenceFromResource = (resource: WorkspaceResource) => {
    if (!previewMode) {
      setToast({ id: `attach-blocked-${Date.now()}`, title: 'Evidence write unavailable', description: 'Live evidence attachment must be implemented by the authoritative backend first.', duration: 6000 });
      return;
    }
    if (!selectedWorkItem) {
      setEvidenceTargetResource(resource);
      return;
    }
    attachPreviewResource(selectedWorkItem, resource);
  };

  const handleBatchAttachEvidence = (resources: WorkspaceResource[]) => {
    if (!previewMode) {
      setToast({ id: `batch-attach-blocked-${Date.now()}`, title: 'Evidence write unavailable', description: 'Live batch attachment is disabled rather than simulated.', duration: 6000 });
      return;
    }
    if (resources.length === 0) return;
    if (selectedWorkItem) resources.forEach(resource => attachPreviewResource(selectedWorkItem, resource));
    else setBatchEvidenceTargetResources(resources);
  };

  const handleUpdateWorkItem = (updated: WorkItem) => {
    if (!previewMode) {
      setToast({ id: `edit-blocked-${Date.now()}`, title: 'Edit unavailable', description: 'V2 has no generic WorkItem edit contract. Canonical state was not changed locally.', duration: 6000 });
      return;
    }
    setWorkItems(previous => previous.map(item => item.id === updated.id ? updated : item));
    setReviewQueue(previous => previous.map(review => review.workItem.id === updated.id ? { ...review, workItem: updated } : review));
    setSelectedWorkItem(previous => previous?.id === updated.id ? updated : previous);
  };

  const handleToggleMockMode = () => {
    setToast({
      id: `preview-mode-${Date.now()}`,
      title: previewMode ? 'Preview mode is URL-controlled' : 'Preview mode disabled',
      description: previewMode ? 'Remove ?preview=1 and reload to return to live mode.' : 'Add ?preview=1 and reload to enter explicit preview mode.',
      duration: 5000,
    });
  };

  const openWorkItem = (id: string) => {
    const found = workItems.find(item => item.id === id);
    if (!found) return;
    setSelectedWorkItem(found);
    setActiveTab('work');
    setIsInspectorOpen(true);
  };

  return (
    <DensityProvider density={density} onDensityChange={setDensity}>
      <div className="flex h-screen w-screen overflow-hidden bg-[#090d16] text-slate-100 font-sans">
        <Navigation
          activeTab={activeTab}
          onTabChange={tab => {
            setActiveTab(tab);
            if (tab !== 'work') setIsInspectorOpen(false);
          }}
          reviewCount={reviewQueue.length}
          workCount={workItems.length}
          connectionState={connectionState}
          isMockMode={isMockMode}
          density={density}
          onToggleDensity={() => setDensity(current => current === 'comfortable' ? 'compact' : current === 'compact' ? 'dense' : 'comfortable')}
          activeScenario={activeScenario}
          onScenarioChange={handleScenarioChange}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          onOpenConnectionDiagnostics={() => setIsConnectionModalOpen(true)}
          onOpenTelemetry={() => setIsTelemetryOpen(true)}
        />

        <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
          <div className="flex-1 flex overflow-hidden">
            {activeTab === 'home' && (
              <HomeView
                workItems={workItems}
                reviewQueue={reviewQueue}
                integrations={integrations}
                onSelectItem={item => { setSelectedWorkItem(item); setIsInspectorOpen(true); }}
                onSelectReview={review => { setSelectedWorkItem(review.workItem); setActiveTab('review'); }}
                onNavigateToTab={tab => setActiveTab(tab)}
                onApprove={handleApproveWorkItem}
                onReconnectIntegration={handleReconnectIntegration}
                density={density}
              />
            )}

            {activeTab === 'work' && (
              <WorkView
                workItems={workItems}
                selectedItem={selectedWorkItem}
                onSelectItem={item => { setSelectedWorkItem(item); setIsInspectorOpen(true); }}
                density={density}
                onToggleDensity={() => setDensity(current => current === 'comfortable' ? 'compact' : current === 'compact' ? 'dense' : 'comfortable')}
              />
            )}

            {activeTab === 'review' && (
              <ReviewQueueView
                reviewQueue={reviewQueue}
                onApprove={handleApproveWorkItem}
                onReject={handleRejectWorkItem}
                onSelectWorkItem={item => { setSelectedWorkItem(item); setIsInspectorOpen(true); }}
                onUpdateWorkItem={handleUpdateWorkItem}
              />
            )}

            {activeTab === 'activity' && (
              <ActivityView observations={observations} workItems={workItems} onSelectWorkItem={item => { setSelectedWorkItem(item); setIsInspectorOpen(true); }} />
            )}

            {activeTab === 'integrations' && (
              <IntegrationsView integrations={integrations} onRefresh={checkBackendHealth} onReconnect={handleReconnectIntegration} />
            )}

            {activeTab === 'evidence' && (
              <EvidenceGraphView workItems={workItems} observations={observations} onSelectWorkItem={item => { setSelectedWorkItem(item); setIsInspectorOpen(true); }} />
            )}

            {activeTab === 'workspace_search' && (
              <UniversalSearchView
                onSelectResource={resource => { const linkedId = resource.linkedWorkItems?.[0]; if (linkedId) openWorkItem(linkedId); }}
                onCreateWorkItem={handleCreateWorkItemFromResource}
                onAttachEvidence={handleAttachEvidenceFromResource}
                onLinkWorkItem={handleAttachEvidenceFromResource}
                onBatchCreateWork={resources => resources.forEach(resource => { void handleCreateWorkItemFromResource(resource); })}
                onBatchAttachEvidence={handleBatchAttachEvidence}
                onNavigateToWorkItem={openWorkItem}
              />
            )}

            {activeTab === 'component_registry' && <ComponentRegistryView />}

            {activeTab === 'drive' && (
              <DriveSurface
                onAttachToWorkItem={handleAttachDriveToWorkItem}
                onCreateWorkItem={handleCreateWorkItemFromResource}
                onAttachEvidence={handleAttachEvidenceFromResource}
                onLinkWorkItem={handleAttachEvidenceFromResource}
                onNavigateToWorkItem={openWorkItem}
              />
            )}

            {activeTab === 'gmail' && (
              <GmailSurface
                onPromoteToWorkItem={handlePromoteGmailToWorkItem}
                onCreateWorkItem={handleCreateWorkItemFromResource}
                onAttachEvidence={handleAttachEvidenceFromResource}
                onLinkWorkItem={handleAttachEvidenceFromResource}
                onNavigateToWorkItem={openWorkItem}
              />
            )}

            {activeTab === 'calendar' && (
              <CalendarSurface
                onSelectWorkItem={openWorkItem}
                onCreateWorkItem={handleCreateWorkItemFromResource}
                onAttachEvidence={handleAttachEvidenceFromResource}
                onLinkWorkItem={handleAttachEvidenceFromResource}
                onNavigateToWorkItem={openWorkItem}
              />
            )}

            {activeTab === 'sheets' && (
              <SheetsSurface onCreateWorkItem={handleCreateWorkItemFromResource} onAttachEvidence={handleAttachEvidenceFromResource} onLinkWorkItem={handleAttachEvidenceFromResource} />
            )}

            {activeTab === 'docs' && (
              <DocsSurface onCreateWorkItem={handleCreateWorkItemFromResource} onAttachEvidence={handleAttachEvidenceFromResource} onLinkWorkItem={handleAttachEvidenceFromResource} onNavigateToWorkItem={openWorkItem} />
            )}

            {activeTab === 'keep' && (
              <KeepSurface
                onPromoteToWorkItem={handlePromoteKeepToWorkItem}
                onCreateWorkItem={handleCreateWorkItemFromResource}
                onAttachEvidence={handleAttachEvidenceFromResource}
                onLinkWorkItem={handleAttachEvidenceFromResource}
                onNavigateToWorkItem={openWorkItem}
              />
            )}

            {isInspectorOpen && selectedWorkItem && (
              <Inspector item={selectedWorkItem} onClose={() => setIsInspectorOpen(false)} onApprove={handleApproveWorkItem} onReject={handleRejectWorkItem} />
            )}
          </div>
        </div>

        <Toast toast={toast} onDismiss={() => setToast(null)} />

        <CommandPalette
          isOpen={isCommandPaletteOpen}
          onClose={() => setIsCommandPaletteOpen(false)}
          onNavigate={tab => setActiveTab(tab as ViewTab)}
          workItems={workItems}
          observations={observations}
          onSelectWorkItem={item => { setSelectedWorkItem(item); setIsInspectorOpen(true); }}
          onSelectObservation={() => setActiveTab('activity')}
          onTriggerReviewNext={() => { if (reviewQueue.length > 0) { setSelectedWorkItem(reviewQueue[0].workItem); setActiveTab('review'); } }}
          onRetryConnection={checkBackendHealth}
        />

        <ConnectionModal
          isOpen={isConnectionModalOpen}
          onClose={() => setIsConnectionModalOpen(false)}
          connectionState={connectionState}
          healthResult={healthResult}
          isMockMode={isMockMode}
          onToggleMockMode={handleToggleMockMode}
          onRetry={checkBackendHealth}
          isChecking={isCheckingBackend}
        />

        <TelemetryHUD isOpen={isTelemetryOpen} onClose={() => setIsTelemetryOpen(false)} />

        <AttachEvidenceModal
          isOpen={previewMode && (evidenceTargetResource !== null || batchEvidenceTargetResources.length > 0)}
          onClose={() => { setEvidenceTargetResource(null); setBatchEvidenceTargetResources([]); }}
          resource={evidenceTargetResource}
          resources={batchEvidenceTargetResources}
          workItems={workItems}
          onSelectWorkItem={(item, resource) => {
            handleAttachResourceToTarget(item, resource);
            setEvidenceTargetResource(null);
            setBatchEvidenceTargetResources([]);
          }}
          onBatchSelectWorkItem={(item, resources) => {
            handleBatchAttachResourcesToTarget(item, resources);
            setBatchEvidenceTargetResources([]);
          }}
          onCreateNewWithEvidence={resource => {
            void handleCreateWorkItemFromResource(resource);
            setEvidenceTargetResource(null);
            setBatchEvidenceTargetResources([]);
          }}
        />
      </div>
    </DensityProvider>
  );
}
